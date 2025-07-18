import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$: Observable<boolean> = this.loadingSubject.asObservable();

  constructor() { }

  setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  get isLoading(): boolean {
    return this.loadingSubject.value;
  }
}
