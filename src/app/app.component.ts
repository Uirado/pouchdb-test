import { Component, OnInit } from '@angular/core';
import { RepositoryService } from './service/repository.service';
import { Observable } from 'rxjs';
import { TimelineEvent } from './model/timeline-event.model';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  eventList: Observable<TimelineEvent[]>;

  constructor(
    private readonly repository: RepositoryService,
  ) {
    this.repository.connect('wtx02-jmpid-12345');
  }

  ngOnInit() {
    this.eventList = this.repository.getLiveList().pipe(
      tap(console.log),
    );
  }

  addRow() {
    this.repository.create(createRandomTimelineEvent());
  }

  deleteRow(event: PouchDB.Core.ExistingDocument<TimelineEvent>) {
    this.repository.delete(event);
  }
}

function createRandomTimelineEvent(): TimelineEvent {
  const size = 10000;
  return {
    data01: `${Math.floor(Math.random() * size)}`,
    data02: `${Math.floor(Math.random() * size)}`,
    data03: `${Math.floor(Math.random() * size)}`,
    data04: `${Math.floor(Math.random() * size)}`,
    data05: `${Math.floor(Math.random() * size)}`,
    data06: `${Math.floor(Math.random() * size)}`,
    data07: `${Math.floor(Math.random() * size)}`,
    data08: `${Math.floor(Math.random() * size)}`,
    data09: `${Math.floor(Math.random() * size)}`,
    data10: `${Math.floor(Math.random() * size)}`,
    data11: `${Math.floor(Math.random() * size)}`,
    data12: `${Math.floor(Math.random() * size)}`,
    data13: `${Math.floor(Math.random() * size)}`,
    data14: `${Math.floor(Math.random() * size)}`,
    data15: `${Math.floor(Math.random() * size)}`,
    data16: `${Math.floor(Math.random() * size)}`,
    data17: `${Math.floor(Math.random() * size)}`,
    data18: `${Math.floor(Math.random() * size)}`,
    data19: `${Math.floor(Math.random() * size)}`,
    data20: `${Math.floor(Math.random() * size)}`,
  };
}
