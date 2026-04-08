import { executeBrowserAction } from './browser-manager.js';
import { searchKnowledge } from './knowledge-service.js';
import { executeSkill } from './skill-executor.js';

export async function processMessage(conversation, message, supabase, userId) {
  try {
    const agent = conversation.agents;

    const { data: previousMessages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })
      .limit(20);

    const { data: agentSkills } = await supabase
      .from('agent_skills')
      .select('*, skills(*)')
      .eq('agent_id', agent.id)
      .eq('enabled', true);

    const contextMessages = previousMessages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    const relevantKnowledge = await searchKnowledge(
      message.content,
      agent.id,
      supabase
    );

    let systemPrompt = agent.system_prompt || 'You are a helpful AI assistant.';

    if (relevantKnowledge.length > 0) {
      systemPrompt += '\n\nRelevant knowledge:\n';
      relevantKnowledge.forEach(k => {
        systemPrompt += `- ${k.title}: ${k.content.substring(0, 500)}\n`;
      });
    }

    if (agentSkills && agentSkills.length > 0) {
      systemPrompt += '\n\nAvailable skills:\n';
      agentSkills.forEach(as => {
        systemPrompt += `- ${as.skills.name}: ${as.skills.description}\n`;
      });
    }

    const intentAnalysis = analyzeIntent(message.content);

    if (intentAnalysis.requiresBrowser) {
      const browserResult = await executeBrowserAction(
        intentAnalysis.action,
        intentAnalysis.parameters,
        agent.id,
        userId,
        supabase
      );

      return {
        content: formatBrowserResponse(browserResult, message.content),
        metadata: {
          action: 'browser',
          result: browserResult,
        },
      };
    }

    if (intentAnalysis.requiresSkill && agentSkills) {
      const skill = agentSkills.find(as =>
        as.skills.slug === intentAnalysis.skill
      );

      if (skill) {
        const skillResult = await executeSkill(
          skill.skills,
          intentAnalysis.parameters,
          supabase
        );

        return {
          content: `I executed the ${skill.skills.name} skill. Result: ${JSON.stringify(skillResult, null, 2)}`,
          metadata: {
            action: 'skill',
            skill: skill.skills.name,
            result: skillResult,
          },
        };
      }
    }

    const aiResponse = await generateAIResponse(
      systemPrompt,
      contextMessages,
      message.content,
      agent
    );

    return {
      content: aiResponse,
      metadata: {
        action: 'chat',
        model: agent.model_name,
      },
    };
  } catch (error) {
    console.error('Process message error:', error);
    return {
      content: 'I encountered an error processing your request. Please try again.',
      metadata: {
        error: error.message,
      },
    };
  }
}

function analyzeIntent(messageContent) {
  const lowerContent = messageContent.toLowerCase();

  if (
    lowerContent.includes('open') ||
    lowerContent.includes('navigate') ||
    lowerContent.includes('visit') ||
    lowerContent.includes('go to')
  ) {
    const urlMatch = messageContent.match(/https?:\/\/[^\s]+/);
    return {
      requiresBrowser: true,
      action: 'navigate',
      parameters: { url: urlMatch ? urlMatch[0] : null },
    };
  }

  if (
    lowerContent.includes('click') ||
    lowerContent.includes('fill') ||
    lowerContent.includes('type') ||
    lowerContent.includes('submit')
  ) {
    return {
      requiresBrowser: true,
      action: 'interact',
      parameters: { instruction: messageContent },
    };
  }

  if (
    lowerContent.includes('search for') ||
    lowerContent.includes('find information')
  ) {
    return {
      requiresBrowser: true,
      action: 'search',
      parameters: { query: messageContent },
    };
  }

  return {
    requiresBrowser: false,
    requiresSkill: false,
    action: 'chat',
    parameters: {},
  };
}

function formatBrowserResponse(browserResult, originalMessage) {
  if (browserResult.success) {
    let response = `I've completed the browser action. `;

    if (browserResult.url) {
      response += `I'm now at ${browserResult.url}. `;
    }

    if (browserResult.title) {
      response += `The page title is "${browserResult.title}". `;
    }

    if (browserResult.content) {
      response += `\n\nPage content:\n${browserResult.content.substring(0, 1000)}...`;
    }

    if (browserResult.screenshot) {
      response += `\n\nI've also captured a screenshot of the page.`;
    }

    return response;
  } else {
    return `I encountered an issue: ${browserResult.error || 'Unknown error'}`;
  }
}

async function generateAIResponse(systemPrompt, contextMessages, userMessage, agent) {
  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...contextMessages,
      { role: 'user', content: userMessage },
    ];

    if (agent.model_provider === 'openai') {
      return await generateOpenAIResponse(messages, agent.model_name);
    } else if (agent.model_provider === 'anthropic') {
      return await generateAnthropicResponse(messages, agent.model_name);
    } else {
      return "I'm configured with an unsupported AI provider. Please check my settings.";
    }
  } catch (error) {
    console.error('Generate AI response error:', error);
    return 'I apologize, but I encountered an error generating a response. Please try again.';
  }
}

async function generateOpenAIResponse(messages, model) {
  return `This is a simulated response. To enable real AI responses, please configure your OpenAI API key in the environment variables and implement the OpenAI client.`;
}

async function generateAnthropicResponse(messages, model) {
  return `This is a simulated response. To enable real AI responses, please configure your Anthropic API key in the environment variables and implement the Anthropic client.`;
}
