import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { AuthActions } from '../../common/auth';
import { ComplaintComponent } from '../complaint/complaint.component';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {

  constructor(
    private authActions: AuthActions,
    private router: Router,
    private store: Store<any>,
    private modalService: NgbModal
  ) {}

  ngOnInit() {
  }

  openComplaintModal() {
    this.modalService.open(ComplaintComponent);
  }

  logout() {
    this.store.dispatch(this.authActions.logout());
    this.router.navigate(['/']);
  }

}
