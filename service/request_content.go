package service

import (
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
)

// ExtractRequestContentSummary extracts a truncated text summary from a relay request
// for admin-only logging. Binary content (images, audio, files) is not included.
// Returns empty string if feature is disabled or request type is not supported.
func ExtractRequestContentSummary(relayInfo *relaycommon.RelayInfo) string {
	if !common.LogContentEnabled || relayInfo == nil || relayInfo.Request == nil {
		return ""
	}

	maxLen := common.LogContentMaxLength
	if maxLen <= 0 {
		return ""
	}

	var sb strings.Builder

	switch req := relayInfo.Request.(type) {
	case *dto.GeneralOpenAIRequest:
		extractOpenAIContent(&sb, req, maxLen)
	case *dto.OpenAIResponsesRequest:
		extractResponsesContent(&sb, req, maxLen)
	case *dto.OpenAIResponsesCompactionRequest:
		extractResponsesCompactionContent(&sb, req, maxLen)
	case *dto.ClaudeRequest:
		extractClaudeContent(&sb, req, maxLen)
	default:
		return ""
	}

	return truncateRunes(sb.String(), maxLen)
}

func extractOpenAIContent(sb *strings.Builder, req *dto.GeneralOpenAIRequest, maxLen int) {
	// Only log the LAST user message (the actual user input)
	// Earlier user messages often contain tool-injected context (CLAUDE.md, AGENTS.md, etc.)
	var lastUserMsg *dto.Message
	for i := len(req.Messages) - 1; i >= 0; i-- {
		if req.Messages[i].Role == "user" {
			lastUserMsg = &req.Messages[i]
			break
		}
	}
	if lastUserMsg != nil {
		content := lastUserMsg.StringContent()
		if content != "" {
			sb.WriteString(content)
		} else if lastUserMsg.Content != nil {
			sb.WriteString("[multimodal]")
		}
		return
	}
	// Prompt field (completions endpoint)
	if req.Prompt != nil {
		if v, ok := req.Prompt.(string); ok {
			sb.WriteString(v)
		}
	}
	// Input field (embeddings endpoint)
	if req.Input != nil && sb.Len() == 0 {
		inputs := req.ParseInput()
		sb.WriteString(strings.Join(inputs, "\n"))
	}
}

func extractResponsesContent(sb *strings.Builder, req *dto.OpenAIResponsesRequest, maxLen int) {
	if req.Input == nil {
		return
	}

	// Input can be a plain string (the user's message directly)
	if common.GetJsonType(req.Input) == "string" {
		var str string
		if common.Unmarshal(req.Input, &str) == nil && str != "" {
			sb.WriteString(str)
		}
		return
	}

	// Input is an array of message objects with role/content
	// Only extract the LAST user message (the actual user input)
	if common.GetJsonType(req.Input) == "array" {
		var inputs []dto.Input
		if common.Unmarshal(req.Input, &inputs) != nil {
			return
		}
		// Find the last user message
		var lastUserInput *dto.Input
		for i := len(inputs) - 1; i >= 0; i-- {
			if inputs[i].Role == "user" {
				lastUserInput = &inputs[i]
				break
			}
		}
		if lastUserInput == nil {
			return
		}
		// Content can be a string
		if common.GetJsonType(lastUserInput.Content) == "string" {
			var str string
			if common.Unmarshal(lastUserInput.Content, &str) == nil && str != "" {
				sb.WriteString(str)
			}
		}
		// Content can be an array of parts
		if common.GetJsonType(lastUserInput.Content) == "array" {
			var parts []map[string]any
			if common.Unmarshal(lastUserInput.Content, &parts) != nil {
				return
			}
			for _, part := range parts {
				if sb.Len() >= maxLen {
					break
				}
				typeVal, _ := part["type"].(string)
				switch typeVal {
				case "input_text":
					text, _ := part["text"].(string)
					if text != "" {
						if sb.Len() > 0 {
							sb.WriteString("\n")
						}
						sb.WriteString(text)
					}
				case "input_image", "input_file":
					if sb.Len() > 0 {
						sb.WriteString("\n")
					}
					sb.WriteString("[")
					sb.WriteString(typeVal)
					sb.WriteString("]")
				}
			}
		}
	}
}

func extractResponsesCompactionContent(sb *strings.Builder, req *dto.OpenAIResponsesCompactionRequest, maxLen int) {
	if len(req.Input) > 0 {
		if sb.Len() > 0 {
			sb.WriteString("\n")
		}
		// CompactionRequest Input is raw JSON, just store as-is (truncated)
		sb.WriteString(string(req.Input))
	}
}

func extractClaudeContent(sb *strings.Builder, req *dto.ClaudeRequest, maxLen int) {
	// Find the last user message
	var lastUserMsg *dto.ClaudeMessage
	for i := len(req.Messages) - 1; i >= 0; i-- {
		if req.Messages[i].Role == "user" {
			lastUserMsg = &req.Messages[i]
			break
		}
	}
	if lastUserMsg != nil {
		content := lastUserMsg.GetStringContent()
		if content != "" {
			sb.WriteString(content)
		} else if lastUserMsg.Content != nil {
			sb.WriteString("[multimodal]")
		}
		return
	}
	// Fallback: legacy Prompt field
	if req.Prompt != "" {
		sb.WriteString(req.Prompt)
	}
}

func truncateRunes(s string, maxLen int) string {
	runes := []rune(s)
	if len(runes) > maxLen {
		return string(runes[:maxLen]) + "..."
	}
	return s
}
