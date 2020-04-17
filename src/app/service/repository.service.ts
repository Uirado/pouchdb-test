import { Injectable } from '@angular/core';
import PouchDB from 'pouchdb';
import { Observable, Subject, merge, from } from 'rxjs';
import { switchMapTo, tap, map } from 'rxjs/operators';
import { TimelineEvent } from '../model/timeline-event.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RepositoryService {

  private localDB: PouchDB.Database<TimelineEvent>;
  private remoteDB: PouchDB.Database<TimelineEvent>;

  private changes$ = new Subject<PouchDB.Core.ChangesResponseChange<TimelineEvent>>();

  constructor() {}

  public connect(databaseName: string) {
    this.localDB = new PouchDB<TimelineEvent>(databaseName);
    this.remoteDB = new PouchDB<TimelineEvent>(`${environment.couchDbUrl}/${databaseName}`);

    this.localDB.sync(this.remoteDB, { live: true, retry: true });

    this.localDB.changes({ since: 'now', live: true, include_docs: true })
      .on('change', (change) => console.log(change));
  }

  onChanges(): Observable<PouchDB.Core.ChangesResponseChange<TimelineEvent>> {
    return this.changes$.asObservable().pipe(
      tap(console.log),
    );
  }

  getLiveList(): Observable<PouchDB.Core.ExistingDocument<TimelineEvent>[]> {
    return merge(
      this.getList(),
      this.onChanges().pipe(
        switchMapTo(this.getList()),
      ),
    );
  }

  getList(): Observable<PouchDB.Core.ExistingDocument<TimelineEvent>[]> {
    return from(this.localDB.allDocs({ include_docs: true })).pipe(
      map(({ rows }) => rows.map(({ doc }) => doc)),
      tap(console.log)
    );
  }

  create(item: TimelineEvent) {
    this.localDB.post<TimelineEvent>(item);
  }

  delete(docMeta: PouchDB.Core.ExistingDocument<TimelineEvent>) {
    this.localDB.remove(docMeta);
  }
}
