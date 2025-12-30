// dashboard.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  // Dashboard functionality to be implemented
}

// dashboard.component.html
// <div class="dashboard-container">
//   <h2>Dashboard</h2>
//   <p>Dashboard functionality will be implemented here</p>
// </div>

// dashboard.component.css
// .dashboard-container {
//   padding: 100px 20px;
//   text-align: center;
// }
