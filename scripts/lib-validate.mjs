/** Shared validation for Catch the AI challenges (drafting + review). */

export function validateChallenge(ch, index) {
  const errors = [];
  const where = ch?.id ?? `#${index}`;

  if (!ch || typeof ch !== 'object') return [`${where}: not an object`];
  if (ch.format !== 'spot_the_slip' && ch.format !== 'real_or_robot') {
    errors.push(`${where}: bad format "${ch.format}"`);
    return errors;
  }
  if (![1, 2, 3].includes(ch.difficulty)) errors.push(`${where}: difficulty must be 1-3`);
  if (!ch.title || typeof ch.title !== 'string') errors.push(`${where}: missing title`);
  if (!ch.explanation || ch.explanation.length < 40) {
    errors.push(`${where}: explanation missing or too short`);
  }
  const p = ch.payload;
  if (!p || !p.intro || !p.instruction) {
    errors.push(`${where}: payload missing intro/instruction`);
    return errors;
  }

  if (ch.format === 'spot_the_slip') {
    if (!p.source || p.source.length < 80) errors.push(`${where}: source missing or too short`);
    if (!Array.isArray(p.segments) || p.segments.length < 3 || p.segments.length > 6) {
      errors.push(`${where}: needs 3-6 segments`);
    } else if (
      !Number.isInteger(ch.answer?.segmentIndex) ||
      ch.answer.segmentIndex < 0 ||
      ch.answer.segmentIndex >= p.segments.length
    ) {
      errors.push(`${where}: answer.segmentIndex out of range`);
    }
  } else {
    if (!Array.isArray(p.options) || p.options.length !== 2) {
      errors.push(`${where}: needs exactly 2 options`);
    } else {
      const ids = p.options.map((o) => o.id).sort().join(',');
      if (ids !== 'a,b') errors.push(`${where}: option ids must be a and b`);
      if (p.options.some((o) => !o.text || o.text.length < 120)) {
        errors.push(`${where}: each option needs substantial text (120+ chars)`);
      }
      if (!p.options.some((o) => o.id === ch.answer?.optionId)) {
        errors.push(`${where}: answer.optionId matches no option`);
      }
    }
  }
  return errors;
}

export function validateBank(challenges) {
  const errors = [];
  const ids = new Set();
  challenges.forEach((ch, i) => {
    errors.push(...validateChallenge(ch, i));
    if (ids.has(ch.id)) errors.push(`duplicate id: ${ch.id}`);
    ids.add(ch.id);
  });
  return errors;
}
