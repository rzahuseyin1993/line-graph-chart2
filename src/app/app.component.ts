import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'my-angular14-line-graph';
  routeArray = [        
    {
        title: 'Graph Line Chart',
        route: '/graph-line-char'
    },        
];
}
