import { Component, input } from '@angular/core';
import { PlayerStats } from '../../models/tournament.models';

@Component({
  selector: 'app-standings-table',
  templateUrl: './standings-table.component.html',
  styleUrl: './standings-table.component.scss',
})
export class StandingsTableComponent {
  readonly standings = input.required<PlayerStats[]>();
}
