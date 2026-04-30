import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { MatchesComponent } from './pages/matches/matches.component';
import { PlayersComponent } from './pages/players/players.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'players', component: PlayersComponent },
  { path: 'matches', component: MatchesComponent },
  { path: '**', redirectTo: '' },
];
