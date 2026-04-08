import { chromium } from 'playwright';

const activeSessions = new Map();

export async function createBrowserSession(agentId, userId, supabase) {
  try {
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    });

    const page = await context.newPage();

    const { data, error } = await supabase
      .from('browser_sessions')
      .insert({
        agent_id: agentId,
        user_id: userId,
        status: 'active',
        viewport: { width: 1920, height: 1080 },
      })
      .select()
      .single();

    if (error) throw error;

    activeSessions.set(data.id, {
      browser,
      context,
      page,
      sessionData: data,
    });

    return data;
  } catch (error) {
    console.error('Create browser session error:', error);
    throw error;
  }
}

export async function getBrowserSession(sessionId) {
  return activeSessions.get(sessionId);
}

export async function closeBrowserSession(sessionId, supabase) {
  try {
    const session = activeSessions.get(sessionId);

    if (session) {
      await session.context.close();
      await session.browser.close();
      activeSessions.delete(sessionId);
    }

    await supabase
      .from('browser_sessions')
      .update({
        status: 'closed',
        closed_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    return true;
  } catch (error) {
    console.error('Close browser session error:', error);
    throw error;
  }
}

export async function executeBrowserAction(action, parameters, agentId, userId, supabase) {
  try {
    let session = null;
    let sessionId = null;

    for (const [id, sess] of activeSessions.entries()) {
      if (sess.sessionData.agent_id === agentId && sess.sessionData.user_id === userId) {
        session = sess;
        sessionId = id;
        break;
      }
    }

    if (!session) {
      const newSession = await createBrowserSession(agentId, userId, supabase);
      session = activeSessions.get(newSession.id);
      sessionId = newSession.id;
    }

    const { page } = session;

    let result = { success: false };

    switch (action) {
      case 'navigate':
        if (parameters.url) {
          await page.goto(parameters.url, { waitUntil: 'networkidle' });
          const title = await page.title();
          const url = page.url();
          const screenshot = await page.screenshot({ encoding: 'base64' });

          result = {
            success: true,
            url,
            title,
            screenshot,
          };

          await supabase
            .from('browser_sessions')
            .update({
              url,
              title,
              screenshot_url: `data:image/png;base64,${screenshot}`,
              last_activity_at: new Date().toISOString(),
            })
            .eq('id', sessionId);
        }
        break;

      case 'interact':
        const pageContent = await page.content();
        result = {
          success: true,
          content: pageContent.substring(0, 2000),
          message: 'Interaction simulated. Advanced browser automation requires additional implementation.',
        };
        break;

      case 'search':
        await page.goto('https://www.google.com', { waitUntil: 'networkidle' });
        const searchBox = await page.$('textarea[name="q"]');
        if (searchBox) {
          await searchBox.fill(parameters.query);
          await searchBox.press('Enter');
          await page.waitForLoadState('networkidle');

          const title = await page.title();
          const url = page.url();
          const screenshot = await page.screenshot({ encoding: 'base64' });

          result = {
            success: true,
            url,
            title,
            screenshot,
            query: parameters.query,
          };
        }
        break;

      default:
        result = {
          success: false,
          error: 'Unknown action',
        };
    }

    return result;
  } catch (error) {
    console.error('Execute browser action error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function getBrowserScreenshot(sessionId) {
  try {
    const session = activeSessions.get(sessionId);

    if (!session) {
      throw new Error('Browser session not found');
    }

    const screenshot = await session.page.screenshot({ encoding: 'base64' });

    return `data:image/png;base64,${screenshot}`;
  } catch (error) {
    console.error('Get browser screenshot error:', error);
    throw error;
  }
}

export async function extractPageContent(sessionId) {
  try {
    const session = activeSessions.get(sessionId);

    if (!session) {
      throw new Error('Browser session not found');
    }

    const content = await session.page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        text: document.body.innerText,
        links: Array.from(document.querySelectorAll('a')).map(a => ({
          text: a.innerText,
          href: a.href,
        })),
      };
    });

    return content;
  } catch (error) {
    console.error('Extract page content error:', error);
    throw error;
  }
}
