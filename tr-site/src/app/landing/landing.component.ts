import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {

  public spryGroupLogo = 'assets/img/spry-group-logo.png';

  constructor() { }

  ngOnInit() {
  }

}
