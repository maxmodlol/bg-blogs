import { Component, Input, OnInit } from '@angular/core';
import { PostService } from '../post/post.service';
import { ChangeDetectorRef } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.scss'],
})
export class PostComponent implements OnInit {
  @Input() post: any;
  newComment: string = '';
  newReplies: { [key: string]: string } = {};
  isSubmittingComment: boolean = false;
  isSubmittingReply: { [key: string]: boolean } = {};
  errorMessage: string = '';
  showComments: boolean = false;
  reactionTypes: string[] = ['like', 'love', 'haha', 'sad', 'angry'];
  isReactionPickerVisible: boolean = false;

  constructor(
    private postService: PostService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.ensureArrayStructure();
  }

  ensureArrayStructure() {
    this.post.comments = Array.isArray(this.post.comments)
      ? this.post.comments
      : Object.values(this.post.comments || []);

    this.post.comments.forEach((comment: any) => {
      comment.replies = Array.isArray(comment.replies)
        ? comment.replies
        : Object.values(comment.replies || []);
    });
  }

  showReactionPicker(commentOrReply?: any) {
    if (commentOrReply) {
      commentOrReply.isReactionPickerVisible = true;
    } else {
      this.isReactionPickerVisible = true;
    }
  }

  hideReactionPicker(commentOrReply?: any) {
    if (commentOrReply) {
      commentOrReply.isReactionPickerVisible = false;
    } else {
      this.isReactionPickerVisible = false;
    }
  }

  getTopReaction(commentOrReply?: any): string {
    const reactions = commentOrReply
      ? commentOrReply.reactions
      : this.post.reactions;
    if (!reactions || reactions.length === 0) {
      return 'like';
    }
    const reactionCounts = this.reactionTypes.map((type) => ({
      type,
      count: reactions.filter((r: any) => r.type === type).length,
    }));
    return reactionCounts.sort((a, b) => b.count - a.count)[0].type;
  }

  getTotalReactions(commentOrReply?: any): number {
    return commentOrReply
      ? commentOrReply.reactions.length
      : this.post.reactions.length;
  }

  toggleReaction(
    target: string,
    postId: string,
    reactionType: string,
    commentId?: string,
    replyId?: string
  ): void {
    const targetItem = this.getTargetItem(target, commentId, replyId);

    if (this.hasUserReacted(targetItem)) {
      this.removeReaction(target, postId, targetItem._id);
    } else {
      this.addReaction(target, postId, reactionType, targetItem._id);
    }
  }

  getTargetItem(target: string, commentId?: string, replyId?: string) {
    if (target === 'post') {
      return this.post;
    } else if (target === 'comment') {
      return this.post.comments.find(
        (comment: any) => comment._id === commentId
      );
    } else if (target === 'reply') {
      const comment = this.post.comments.find(
        (comment: any) => comment._id === commentId
      );
      return comment.replies.find((reply: any) => reply._id === replyId);
    }
    return null;
  }

  hasUserReacted(item: any): boolean {
    const userId = this.getCurrentUserId();
    return item.reactions.some((reaction: any) => reaction.user === userId);
  }

  getCurrentUserId(): string {
    return localStorage.getItem('userId') || '';
  }

  addReaction(
    target: string,
    postId: string,
    reactionType: string,
    itemId?: string
  ) {
    this.postService
      .addReaction(target, postId, reactionType, itemId)
      .subscribe((response) => {
        if (response && response.success) {
          const item = this.getTargetItem(target, itemId);
          item.reactions = response.data;
          this.cdr.detectChanges();
        }
      });
  }

  removeReaction(target: string, postId: string, reactionId: string) {
    this.postService
      .removeReaction(target, postId, reactionId)
      .subscribe((response) => {
        if (response && response.success) {
          const item = this.getTargetItem(target, reactionId);
          item.reactions = response.data;
          this.cdr.detectChanges();
        }
      });
  }

  onSubmitComment(): void {
    this.addComment().subscribe((response) => {
      if (response && response.success) {
        this.post.comments.push(...response.data);
        this.isSubmittingComment = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSubmitReply(commentId: string): void {
    this.addReply(commentId).subscribe((response) => {
      if (response && response.success && response.data) {
        const comment = this.post.comments.find(
          (c: any) => c._id === commentId
        );
        if (comment) {
          comment.replies.push(response.data[0]);
          this.isSubmittingReply[commentId] = false;
          this.cdr.detectChanges();
        }
      }
    });
  }

  addComment(): Observable<any> {
    if (this.newComment.trim() && this.post?._id) {
      this.isSubmittingComment = true;
      const newCommentContent = this.newComment.trim();
      this.newComment = '';

      return this.postService
        .addComment(this.post._id, { content: newCommentContent })
        .pipe(
          catchError((error) => {
            console.error('Error adding comment:', error);
            this.errorMessage = 'Failed to add comment. Please try again.';
            this.isSubmittingComment = false;
            return of(null);
          })
        );
    } else {
      console.error('Post ID is undefined or new comment is empty');
      return of(null);
    }
  }

  addReply(commentId: string): Observable<any> {
    const newReplyContent = this.newReplies[commentId]?.trim();
    if (newReplyContent && this.post?._id && commentId) {
      this.isSubmittingReply[commentId] = true;
      this.newReplies[commentId] = '';

      return this.postService
        .addReply(this.post._id, commentId, { content: newReplyContent })
        .pipe(
          catchError((error) => {
            console.error('Error adding reply:', error);
            this.errorMessage = 'Failed to add reply. Please try again.';
            this.isSubmittingReply[commentId] = false;
            return of(null);
          })
        );
    } else {
      console.error(
        'Post ID or Comment ID is undefined, or new reply is empty'
      );
      return of(null);
    }
  }

  toggleComments() {
    this.showComments = !this.showComments;
  }

  toggleReplies(commentId: string) {
    const comment = this.post.comments.find((c: any) => c._id === commentId);
    if (comment) {
      comment.showReplies = !comment.showReplies;
    }
  }
}
