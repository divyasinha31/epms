import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor() { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        this.logError(error, req);
        return throwError(() => error);
      })
    );
  }

  private logError(error: HttpErrorResponse, request: HttpRequest<any>): void {
    // Log to console in development
    if (!environment.production) {
      console.group('-- HTTP Error --');
      console.error('Request URL:', request.url);
      console.error('Request Method:', request.method);
      console.error('Error Status:', error.status);
      console.error('Error Message:', error.message);
      console.error('Full Error:', error);
      console.groupEnd();
    }
  }
}
