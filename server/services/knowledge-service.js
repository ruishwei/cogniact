export async function searchKnowledge(query, agentId, supabase) {
  try {
    let searchQuery = supabase
      .from('knowledge_base')
      .select('*')
      .textSearch('content', query)
      .limit(5);

    if (agentId) {
      searchQuery = searchQuery.eq('agent_id', agentId);
    }

    const { data, error } = await searchQuery;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Search knowledge error:', error);
    return [];
  }
}

export async function learnFromInteraction(agentId, userId, title, content, metadata, supabase) {
  try {
    const { data, error } = await supabase
      .from('knowledge_base')
      .insert({
        agent_id: agentId,
        user_id: userId,
        title,
        content,
        source_type: 'learned',
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Learn from interaction error:', error);
    return null;
  }
}

export async function importDocumentation(url, agentId, userId, supabase) {
  try {
    const content = `Documentation imported from ${url}`;

    const { data, error } = await supabase
      .from('knowledge_base')
      .insert({
        agent_id: agentId,
        user_id: userId,
        title: `Documentation: ${url}`,
        content,
        source_type: 'documentation',
        source_url: url,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Import documentation error:', error);
    return null;
  }
}

export async function detectKnowledgeChanges(sourceUrl, existingKnowledgeId, supabase) {
  try {
    return {
      hasChanges: false,
      changes: [],
    };
  } catch (error) {
    console.error('Detect knowledge changes error:', error);
    return { hasChanges: false, changes: [] };
  }
}
