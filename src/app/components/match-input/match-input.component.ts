import { Component, computed, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Match, MatchResult, PlayerId } from '../../models/tournament.models';

@Component({
  selector: 'app-match-input',
  imports: [FormsModule],
  templateUrl: './match-input.component.html',
  styleUrl: './match-input.component.scss',
})
export class MatchInputComponent {
  readonly match = input.required<Match>();
  readonly playerNames = input.required<Map<PlayerId, string>>();

  readonly resultChange = output<MatchResult>();
  readonly resultClear = output<void>();

  protected readonly homeGoals = signal<number | null>(null);
  protected readonly awayGoals = signal<number | null>(null);

  protected readonly homeLabel = computed(() => this.teamLabel(this.match().home.players));
  protected readonly awayLabel = computed(() => this.teamLabel(this.match().away.players));

  constructor() {
    effect(() => {
      const result = this.match().result;
      this.homeGoals.set(result?.homeGoals ?? null);
      this.awayGoals.set(result?.awayGoals ?? null);
    });
  }

  protected setHomeGoals(value: number | null): void {
    this.homeGoals.set(this.cleanGoals(value));
    this.save();
  }

  protected setAwayGoals(value: number | null): void {
    this.awayGoals.set(this.cleanGoals(value));
    this.save();
  }

  private save(): void {
    const homeGoals = this.homeGoals();
    const awayGoals = this.awayGoals();
    if (homeGoals === null || awayGoals === null) return;
    this.resultChange.emit({ homeGoals, awayGoals });
  }

  protected clear(): void {
    this.homeGoals.set(null);
    this.awayGoals.set(null);
    this.resultClear.emit();
  }

  private teamLabel(ids: [PlayerId, PlayerId]): string {
    const names = this.playerNames();
    return ids.map((id) => names.get(id) ?? id).join(' + ');
  }

  private cleanGoals(value: number | null): number | null {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return null;
    return Math.max(0, Math.trunc(Number(value)));
  }
}
