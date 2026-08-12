export function announceCourtAssignment(courtName: string, team1Names: string[], team2Names: string[]) {
  if (typeof window === 'undefined') return;

  // Speak using Web Speech API if supported
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel(); // cancel previous
    const team1Text = team1Names.join(' and ');
    const team2Text = team2Names.join(' and ');
    const text = `${courtName}: ${team1Text} versus ${team2Text}!`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}
