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

  private dbConfig: PouchDB.Configuration.RemoteDatabaseConfiguration = {
    auth: {
      username: environment.couchdbUsername,
      password: environment.couchdbPassword,
    }
  };

  private db: PouchDB.Database<TimelineEvent>;
  private syncReplication: PouchDB.Replication.Sync<TimelineEvent>;

  private syncChanges$ = new Subject<any>();
  private syncPaused$ = new Subject<any>();

  constructor() {}

  public connect(databaseName: string) {
    this.db = new PouchDB<TimelineEvent>(databaseName, { ...this.dbConfig });
    this.syncReplication = this.db.sync(`${environment.couchdbURL}/${databaseName}`, { live: true, retry: true });

    this.startListening();
  }

  private startListening() {
    this.syncReplication
      .on('active', () =>  console.log('Sync started'))
      .on('change', info => this.syncChanges$.next(info))
      .on('paused', info => this.syncPaused$.next(info))
      .on('denied', () => console.log('Sync denied'))
      .on('error', () => console.log('Sync error'))
      .on('complete', () => console.log('Sync cancelled'));
  }

  getLiveList(): Observable<PouchDB.Core.ExistingDocument<TimelineEvent>[]> {
    return merge(
      this.getList(),
      this.syncChanges$.pipe(
        switchMapTo(this.syncPaused$),
        switchMapTo(this.getList()),
      ),
    );
  }

  getList(): Observable<PouchDB.Core.ExistingDocument<TimelineEvent>[]> {
    return from(this.db.allDocs({include_docs: true})).pipe(
      map(allDocs => allDocs.rows.map(row => row.doc)),
    );
  }

  create(item: TimelineEvent) {
    this.db.post<TimelineEvent>(item);
  }

  delete(docMeta: PouchDB.Core.ExistingDocument<TimelineEvent>) {
    this.db.remove(docMeta);
  }
}
