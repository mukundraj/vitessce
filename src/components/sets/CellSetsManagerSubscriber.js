import React, { useCallback, useEffect, useReducer } from 'react';
import PubSub from 'pubsub-js';
import packageJson from '../../../package.json';
import {
  CELL_SETS_VIEW, CELLS_SELECTION,
  CELLS_ADD, STATUS_WARN, CELLS_COLOR, CELL_SETS_ADD,
  CELL_SETS_CHANGE, CLEAR_PLEASE_WAIT,
} from '../../events';
import SetsManager from './SetsManager';
import TitleInfo from '../TitleInfo';
import reducer, {
  treeInitialize, ACTION, treeToVisibleCells,
  treeExportLevelZeroNode, treeExportSet,
} from './reducer';
import { handleExportJSON, downloadForUser, FILE_EXTENSION_JSON } from './io';

const SETS_DATATYPE_CELL = 'cell';
const initialTree = treeInitialize(SETS_DATATYPE_CELL);

/**
 * A subscriber wrapper around the SetsManager component
 * for the 'cell' datatype.
 * @param {object} props
 * @param {function} removeGridComponent The callback function to pass to TitleInfo,
 * to call when the component has been removed from the grid.
 * @param {function} onReady The function to call when the component has finished
 * initializing (subscribing to relevant events, etc).
 */
export default function CellSetsManagerSubscriber(props) {
  const {
    removeGridComponent,
    onReady,
  } = props;

  const onReadyCallback = useCallback(onReady, []);
  const [tree, dispatch] = useReducer(reducer, initialTree);

  function onImportTree(treeToImport) {
    dispatch({ type: ACTION.IMPORT, levelZeroNodes: treeToImport.tree });
  }

  // Subscribe to cell set import events.
  // Subscribe to cell import and selection events.
  useEffect(() => {
    const cellSetsAddToken = PubSub.subscribe(CELL_SETS_ADD,
      (msg, treeToImport) => {
        onImportTree(treeToImport);
      });
    const cellsAddToken = PubSub.subscribe(CELLS_ADD, (msg, cells) => {
      dispatch({ type: ACTION.SET_TREE_ITEMS, cellIds: Object.keys(cells) });
    });
    const cellsSelectionToken = PubSub.subscribe(CELLS_SELECTION, (msg, cellIds) => {
      dispatch({ type: ACTION.SET_CURRENT_SET, cellIds: Array.from(cellIds) });
    });
    onReadyCallback();
    return () => {
      PubSub.unsubscribe(cellSetsAddToken);
      PubSub.unsubscribe(cellsAddToken);
      PubSub.unsubscribe(cellsSelectionToken);
    };
  }, [onReadyCallback]);

  // Publish cell visibility and color changes when the tree changes.
  // Publish the updated tree when the tree changes.
  useEffect(() => {
    const [cellIds, cellColors] = treeToVisibleCells(tree);
    PubSub.publish(CELLS_COLOR, cellColors);
    PubSub.publish(CELL_SETS_VIEW, new Set(cellIds));
    PubSub.publish(CELL_SETS_CHANGE, tree);
  }, [tree]);

  // Callback functions
  function onCheckNodes(checkedKeys) {
    dispatch({ type: ACTION.CHECK_NODES, checkedKeys });
  }

  function onCheckNode(targetKey) {
    dispatch({ type: ACTION.CHECK_NODE, targetKey });
  }

  function onExpandNode(expandedKeys, targetKey, expanded) {
    dispatch({
      type: ACTION.EXPAND_NODE, expandedKeys, targetKey, expanded,
    });
  }

  function onDropNode(dropKey, dragKey, dropPosition, dropToGap) {
    dispatch({
      type: ACTION.DROP_NODE, dropKey, dragKey, dropPosition, dropToGap,
    });
  }

  function onCheckLevel(levelZeroKey, levelIndex) {
    dispatch({ type: ACTION.CHECK_LEVEL, levelZeroKey, levelIndex });
  }

  function onNodeSetColor(targetKey, color) {
    dispatch({ type: ACTION.SET_NODE_COLOR, targetKey, color });
  }

  function onNodeSetName(targetKey, name, stopEditing) {
    dispatch({
      type: ACTION.SET_NODE_NAME, targetKey, name, stopEditing,
    });
  }

  function onNodeSetIsEditing(targetKey, value) {
    dispatch({
      type: ACTION.SET_NODE_IS_EDITING, targetKey, value,
    });
  }

  function onNodeRemove(targetKey) {
    dispatch({ type: ACTION.REMOVE_NODE, targetKey });
  }

  function onNodeView(targetKey) {
    dispatch({ type: ACTION.VIEW_NODE, targetKey });
  }

  function onCreateLevelZeroNode() {
    dispatch({ type: ACTION.CREATE_LEVEL_ZERO_NODE });
  }

  function onUnion() {
    dispatch({ type: ACTION.UNION_CHECKED });
  }

  function onIntersection() {
    dispatch({ type: ACTION.INTERSECTION_CHECKED });
  }

  function onComplement() {
    dispatch({ type: ACTION.COMPLEMENT_CHECKED });
  }

  function onView() {
    dispatch({ type: ACTION.VIEW_CHECKED });
  }

  function onExportLevelZeroNode(nodeKey) {
    const { treeToExport, nodeName } = treeExportLevelZeroNode(tree, nodeKey);
    downloadForUser(
      handleExportJSON(treeToExport),
      `${nodeName}_${packageJson.name}-${SETS_DATATYPE_CELL}-hierarchy.${FILE_EXTENSION_JSON}`,
    );
  }

  function onExportSet(nodeKey) {
    const { setToExport, nodeName } = treeExportSet(tree, nodeKey);
    downloadForUser(
      handleExportJSON(setToExport),
      `${nodeName}_${packageJson.name}-${SETS_DATATYPE_CELL}-set.${FILE_EXTENSION_JSON}`,
      FILE_EXTENSION_JSON,
    );
  }

  return (
    <TitleInfo
      title="Cell Sets"
      isScroll
      removeGridComponent={removeGridComponent}
    >
      <SetsManager
        tree={tree}
        datatype={SETS_DATATYPE_CELL}
        clearPleaseWait={
          layerName => PubSub.publish(CLEAR_PLEASE_WAIT, layerName)
        }
        onError={err => PubSub.publish(STATUS_WARN, err)}
        onCheckNode={onCheckNode}
        onCheckNodes={onCheckNodes}
        onExpandNode={onExpandNode}
        onDropNode={onDropNode}
        onCheckLevel={onCheckLevel}
        onNodeSetColor={onNodeSetColor}
        onNodeSetName={onNodeSetName}
        onNodeSetIsEditing={onNodeSetIsEditing}
        onNodeRemove={onNodeRemove}
        onNodeView={onNodeView}
        onImportTree={onImportTree}
        onCreateLevelZeroNode={onCreateLevelZeroNode}
        onExportLevelZeroNode={onExportLevelZeroNode}
        onExportSet={onExportSet}
        onUnion={onUnion}
        onIntersection={onIntersection}
        onComplement={onComplement}
        onView={onView}
      />
    </TitleInfo>
  );
}
