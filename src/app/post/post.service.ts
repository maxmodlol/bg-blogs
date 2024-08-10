import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

interface PostResponse {
  success: boolean;
  message: string;
  data: any[];
}

@Injectable({
  providedIn: 'root',
})
export class PostService {
  private apiUrl = 'http://localhost:5000/api/v1/posts';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  getPosts(): Observable<PostResponse> {
    return this.http.get<PostResponse>(this.apiUrl, {
      headers: this.getAuthHeaders(),
    });
  }

  getPostById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  createPost(post: { title: string; content: string }): Observable<any> {
    return this.http.post<any>(this.apiUrl, post, {
      headers: this.getAuthHeaders(),
    });
  }

  deletePost(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  addComment(postId: string, comment: { content: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/comment/${postId}`, comment, {
      headers: this.getAuthHeaders(),
    });
  }

  addReply(
    postId: string,
    commentId: string,
    reply: { content: string }
  ): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/comment/reply/${postId}/${commentId}`,
      reply,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }
}
