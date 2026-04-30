import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { REQUIRED_PLAYERS } from '../../models/tournament.models';
import { TournamentStore } from '../../store/tournament.store';

@Component({
  selector: 'app-players',
  imports: [FormsModule, RouterLink],
  templateUrl: './players.component.html',
  styleUrl: './players.component.scss',
})
export class PlayersComponent {
  protected readonly store = inject(TournamentStore);
  protected readonly requiredPlayers = REQUIRED_PLAYERS;
  protected readonly name = signal('');
  protected readonly error = signal('');

  protected addPlayer(): void {
    const added = this.store.addPlayer(this.name());
    if (added) {
      this.name.set('');
      this.error.set('');
      return;
    }
    this.error.set('Enter a unique name. Player list is locked after schedule generation.');
  }

  protected removePlayer(id: string): void {
    this.store.removePlayer(id);
  }
}
