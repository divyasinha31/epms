import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TaskBoardComponent } from './components/task-board/task-board.component';
import { TaskFormComponent } from './components/task-form/task-form.component';

const routes: Routes = [
  { path: '', component: TaskBoardComponent },
  { path: 'new', component: TaskFormComponent },
  { path: ':taskId/edit', component: TaskFormComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TasksRoutingModule { }
