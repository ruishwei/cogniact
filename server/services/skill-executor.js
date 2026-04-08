export async function executeSkill(skill, parameters, supabase) {
  try {
    await supabase
      .from('skills')
      .update({ usage_count: skill.usage_count + 1 })
      .eq('id', skill.id);

    const sandboxedFunction = new Function(
      'parameters',
      'supabase',
      `
        return (async () => {
          ${skill.code}
        })();
      `
    );

    const result = await sandboxedFunction(parameters, supabase);

    return {
      success: true,
      result,
    };
  } catch (error) {
    console.error('Execute skill error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export function validateSkillCode(code) {
  const dangerousPatterns = [
    /require\s*\(/,
    /import\s+/,
    /eval\s*\(/,
    /Function\s*\(/,
    /process\./,
    /fs\./,
    /child_process/,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(code)) {
      return {
        valid: false,
        error: `Dangerous pattern detected: ${pattern}`,
      };
    }
  }

  return { valid: true };
}
