import { Injectable } from '@angular/core';
import PouchDB from 'pouchdb';
import { Observable, Subject, merge, from } from 'rxjs';
import { switchMapTo, map, tap } from 'rxjs/operators';
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

  private dbChanges$ = new Subject<PouchDB.Core.ChangesResponseChange<TimelineEvent>>();
  private syncPaused$ = new Subject<any>();

  constructor() {}

  public connect(databaseName: string) {
    this.db = new PouchDB<TimelineEvent>(databaseName);
    const remoteDB = new PouchDB<TimelineEvent>(`${environment.couchdbURL}/${databaseName}`, { ...this.dbConfig });

    this.syncReplication = this.db.sync(remoteDB, { live: true, retry: true });

    this.startListening();
  }

  private startListening() {
    this.syncReplication
      .on('active', () => console.log('Sync started'))
      .on('change', info => {
        console.log(info);
      })
      .on('paused', info => {
        console.log('sync paused');
        // this.syncPaused$.next(info);
      })
      .on('denied', () => console.log('Sync denied'))
      .on('error', () => console.log('Sync error'))
      .on('complete', () => console.log('Sync cancelled'));

    this.db.changes({ live: true, since: 'now' })
      .on('change', (change) => {
        // console.log(change);
        this.dbChanges$.next(change);
      });
  }

  onDBChanges(): Observable<PouchDB.Core.ChangesResponseChange<TimelineEvent>> {
    return this.dbChanges$.asObservable();
  }

  // getLiveList(): Observable<PouchDB.Core.ExistingDocument<TimelineEvent>[]> {
  //   return merge(
  //     this.getList(),
  //     this.syncChanges$.pipe(
  //       tap(infoChange => console.log(infoChange)),
  //       // switchMapTo(this.syncPaused$),
  //       switchMapTo(this.getList()),
  //     ),
  //   );
  // }

  getList(): Observable<PouchDB.Core.ExistingDocument<TimelineEvent>[]> {
    return from(this.db.allDocs({ include_docs: true })).pipe(
      map(allDocs => allDocs.rows.map(row => row.doc)),
    );
  }

  // allDocs(): Promise<PouchDB.Core.ExistingDocument<TimelineEvent>[]> {
  //   return this.db.allDocs({ include_docs: true })
  //     .then(allDocs => allDocs.rows.map(row => row.doc));
  // }

  create(item: PouchDB.Core.PutDocument<TimelineEvent>) {
    this.db.post<TimelineEvent>(item);
    // this.db.put(item);
  }

  bulkCreate(a: any[]) {
    this.db.bulkDocs<TimelineEvent>(a);
  }

  delete(docMeta: PouchDB.Core.ExistingDocument<TimelineEvent>) {
    this.db.remove(docMeta);
  }
}
