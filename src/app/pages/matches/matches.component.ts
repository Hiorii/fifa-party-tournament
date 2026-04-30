import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatchInputComponent } from '../../components/match-input/match-input.component';
import { StandingsTableComponent } from '../../components/standings-table/standings-table.component';
import { TournamentStore } from '../../store/tournament.store';

@Component({
  selector: 'app-matches',
  imports: [FormsModule, RouterLink, MatchInputComponent, StandingsTableComponent],
  templateUrl: './matches.component.html',
  styleUrl: './matches.component.scss',
})
export class MatchesComponent {
  protected readonly store = inject(TournamentStore);
  protected readonly playerList = computed(
    () => this.store.players().map((player) => player.name).join(', ') || 'No players yet'
  );

  protected resetSchedule(): void {
    if (confirm('Reset the generated schedule and all entered scores?')) {
      this.store.resetSchedule();
    }
  }

  protected resetAll(): void {
    if (confirm('Reset everything: players, schedule, and scores?')) {
      this.store.resetAll();
    }
  }
}
