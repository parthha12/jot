'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('overlay', {
  onShow: (cb) =>
    ipcRenderer.on('overlay-show', (_e, payload) => {
      const p = payload || {};
      cb(p.notes || [], p);
    }),
  onDismiss:  (cb) => ipcRenderer.on('overlay-dismiss', () => cb()),
  snooze:     (noteId, minutes) => ipcRenderer.send('overlay-snooze', noteId, minutes),
  disable:    (noteId)          => ipcRenderer.send('overlay-disable', noteId),
  openNote:   (noteId)          => ipcRenderer.send('overlay-open-note', noteId),
  dismissAll: ()                => ipcRenderer.send('overlay-dismiss-all'),
});
