import { Component, OnInit } from '@angular/core';
import { PostService } from '../post/post.service';
import { UserService } from '../user/user.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent implements OnInit {
  posts: any[] = [];
  users: any[] = [];

  constructor(
    private postService: PostService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadPosts();
    this.loadUsers();
  }

  loadPosts(): void {
    this.postService.getPosts().subscribe(
      (response) => {
        if (response.success) {
          this.posts = response.data;
        }
      },
      (error) => {
        console.error('Failed to load posts', error);
      }
    );
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe(
      (response) => {
        if (response.success) {
          this.users = response.data;
        }
      },
      (error) => {
        console.error('Failed to load users', error);
      }
    );
  }

  deletePost(postId: string): void {
    this.postService.deletePost(postId).subscribe(
      (response) => {
        if (response.success) {
          this.posts = this.posts.filter((post) => post._id !== postId);
        }
      },
      (error) => {
        console.error('Failed to delete post', error);
      }
    );
  }

  deleteUser(userId: string): void {
    this.userService.deleteUser(userId).subscribe(
      (response) => {
        if (response.success) {
          this.users = this.users.filter((user) => user._id !== userId);
        }
      },
      (error) => {
        console.error('Failed to delete user', error);
      }
    );
  }
}
