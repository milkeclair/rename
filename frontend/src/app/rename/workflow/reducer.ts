import { addEntries } from '../model/input';
import { inputAfterExecution } from '../execution/result';
import { changeInput } from './changeInput';
import type { Action, RenameState } from './types';

export function reducer(state: RenameState, action: Action): RenameState {
  switch (action.type) {
    case 'input':
      return state.execution.status === 'editing'
        ? {
            ...state,
            input: changeInput(state.input, action.change),
            preview: null,
            revision: action.revision,
          }
        : state;
    case 'import-started':
      return {
        ...state,
        imports: state.imports + 1,
        preview: null,
        message: '',
        revision: action.revision,
      };
    case 'imported':
      return {
        ...state,
        input: addEntries(state.input, action.entries),
        imports: state.imports - 1,
        preview: null,
        revision: action.revision,
        message:
          action.entries.length === 0
            ? '追加できるファイルがありません。フォルダの直下だけが対象です。'
            : '',
      };
    case 'import-failed':
      return {
        ...state,
        imports: state.imports - 1,
        message: action.message,
        revision: action.revision,
      };
    case 'preview':
      return action.revision === state.revision && state.execution.status === 'editing'
        ? { ...state, preview: action.plan }
        : state;
    case 'started':
      return {
        ...state,
        message: '',
        execution: {
          status: 'running',
          progress: { completed: 0, total: action.request.paths.length, name: '' },
        },
      };
    case 'progress':
      return state.execution.status === 'running'
        ? { ...state, execution: { status: 'running', progress: action.progress } }
        : state;
    case 'finished':
      return {
        ...state,
        input: inputAfterExecution(state.input, action.request, action.result),
        execution: { status: 'result', result: action.result },
      };
    case 'execution-failed':
      return {
        ...state,
        execution: { status: 'editing' },
        preview: null,
        message: action.message,
        revision: action.revision,
      };
    case 'message':
      return { ...state, message: action.message };
    case 'clear':
      return {
        ...state,
        input: {
          ...state.input,
          entries: [],
          settings: { ...state.input.settings, start: '1', outputDir: '' },
        },
        execution: { status: 'editing' },
        preview: { items: [], issue: '' },
        message: '',
        revision: action.revision,
      };
  }
}
