/**
 * dsh-figma-mcp — 宿主 slash 指令。
 */
import { createUserMessage } from '@deepseek-ai/dsh-llm'
import { buildWorkflowPrompt, hasWorkflow, WORKFLOW_LIST } from './prompts.js'

const USAGE = `用法：/dsh-figma-mcp <指令> [补充说明]
${WORKFLOW_LIST}`

export function createFigmaCommands() {
  const handler = async (invocation) => {
    const rawInput = invocation.rawInput?.trim() ?? ''
    const matched = /^(\S+)(?:\s+([\s\S]+))?$/.exec(rawInput)
    const command = matched?.[1] ?? ''
    const initialInput = matched?.[2]?.trim() ?? ''

    if (!hasWorkflow(command)) {
      return { kind: 'error', text: `${command ? `未知指令：${command}` : '缺少指令'}\n\n${USAGE}` }
    }

    const prompt = buildWorkflowPrompt(command, initialInput)
    const agent = invocation.agent
    let steered = false
    if (agent !== undefined && typeof agent.steer === 'function') {
      try {
        agent.steer(createUserMessage({
          content: [{ type: 'text', text: prompt }],
          source: { kind: 'plugin:dsh-figma-mcp', form: 'relay' },
        }))
        steered = true
      } catch { /* 保持 fallback */ }
    }

    return {
      kind: 'success',
      text: steered
        ? `dsh-figma-mcp 内置工作流「${command}」已开启。`
        : '当前环境无法自动注入 dsh-figma-mcp 内置工作流消息。',
    }
  }

  return {
    name: 'dsh-figma-mcp',
    description: 'dsh-figma-mcp 内置工作流指令',
    input: { hint: '<指令> [补充说明]' },
    handler,
  }
}
