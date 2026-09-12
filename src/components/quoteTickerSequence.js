export function shuffleQuoteSequence(quotes, random = Math.random) {
  const sequence = Array.isArray(quotes) ? [...quotes] : [];

  for (let index = sequence.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(random() * (index + 1));
    [sequence[index], sequence[randomIndex]] = [
      sequence[randomIndex],
      sequence[index],
    ];
  }

  return sequence;
}
