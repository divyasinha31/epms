import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProjectListComponent } from './components/project-list/project-list.component';
import { ProjectFormComponent } from './components/project-form/project-form.component';
import { ProjectDetailComponent } from './components/project-detail/project-detail.component';
import { AssignUsersComponent } from './components/assign-users/assign-users.component';

const routes: Routes = [
  {
    path: '',
    component: ProjectListComponent
  },
  {
    path: 'new',
    component: ProjectFormComponent
  },
  {
    path: ':id',
    component: ProjectDetailComponent
  },
  {
    path: ':id/edit',
    component: ProjectFormComponent
  },
  {
    path: ':id/assign-users',
    component: AssignUsersComponent
  },
  {
    path: ':projectId/tasks',
    loadChildren: () => import('../tasks/tasks.module').then(m => m.TasksModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProjectsRoutingModule { }
