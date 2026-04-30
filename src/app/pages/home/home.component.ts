import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TournamentStore } from '../../store/tournament.store';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  protected readonly store = inject(TournamentStore);
}
