import React, { useState, useEffect } from 'react';
import { TreeNode as RcTreeNode } from 'rc-tree';
import { getDataAndAria } from 'rc-tree/es/util';
import classNames from 'classnames';
import range from 'lodash/range';
import PopoverMenu from './PopoverMenu';
import HelpTooltip from './HelpTooltip';
import { callbackOnKeyPress, toHexString } from './utils';
import { ReactComponent as MenuSVG } from '../../assets/menu.svg';


/**
 * Get a string of help text for coloring a particular hierarchy level.
 * @param {integer} i The level. 1 for cluster, 2 for subcluster, etc.
 * @returns {string} The tooltip text for coloring the level.
 */
function getLevelTooltipText(i) {
  if (i === 0) return 'Color by hierarchy';
  const subs = j => ('sub'.repeat(j));
  return `Color by ${subs(i - 1)}cluster`;
}

/**
 * Construct a `menuConfig` array for the PopoverMenu component.
 * @param {object} props The props for the TreeNode component.
 * @returns {object[]} An array of menu items to pass to PopoverMenu.
 */
function makeNodeViewMenuConfig(props) {
  const {
    nodeKey,
    level,
    onCheckNode,
    onNodeRemove,
    onNodeSetIsEditing,
    onExportLevelZeroNode,
    onExportSet,
    checkable,
    editable,
    exportable,
  } = props;

  return [
    ...(editable ? [
      {
        title: 'Rename',
        handler: () => { onNodeSetIsEditing(nodeKey, true); },
        handlerKey: 'r',
      },
      {
        title: 'Delete',
        confirm: true,
        handler: () => { onNodeRemove(nodeKey); },
        handlerKey: 'd',
      },
    ] : []),
    ...(level === 0 && exportable ? [
      {
        title: 'Export hierarchy',
        subtitle: '(to JSON file)',
        handler: () => { onExportLevelZeroNode(nodeKey); },
        handlerKey: 'e',
      },
    ] : []),
    ...(level > 0 ? [
      ...(checkable ? [
        {
          title: 'Select',
          handler: () => { onCheckNode(nodeKey); },
          handlerKey: 's',
        },
      ] : []),
      ...(exportable ? [
        {
          title: 'Export set',
          subtitle: '(to JSON file)',
          handler: () => { onExportSet(nodeKey); },
          handlerKey: 'e',
        },
      ] : []),
    ] : []),
  ];
}

function NamedSetNodeStatic(props) {
  const {
    title,
    nodeKey,
    level,
    height,
    color,
    checkbox,
    isChecking,
    isLeaf,
    onNodeSetColor,
    onNodeView,
    expanded,
    onCheckLevel,
    checkedLevelKey,
    checkedLevelIndex,
    disableTooltip,
    size,
    datatype,
  } = props;
  const shouldCheckNextLevel = (level === 0 && !expanded);
  const nextLevelToCheck = (
    (checkedLevelIndex && nodeKey === checkedLevelKey && checkedLevelIndex < height)
      ? checkedLevelIndex + 1
      : 1
  );
  let tooltipText;
  if (shouldCheckNextLevel) {
    tooltipText = getLevelTooltipText(nextLevelToCheck);
  } else if (isLeaf || !expanded) {
    tooltipText = `Color individual set (${size} ${datatype}${(size === 1 ? '' : 's')})`;
  } else {
    tooltipText = 'Color by expanded descendants';
  }
  // If this is a level zero node and is _not_ expanded, then upon click,
  // the behavior should be to color by the first or next cluster level.
  // If this is a level zero node and _is_ expanded, or if any other node,
  // click should trigger onNodeView.
  const onClick = (level === 0 && !expanded
    ? () => onCheckLevel(nodeKey, nextLevelToCheck)
    : () => onNodeView(nodeKey)
  );
  const tooltipProps = (disableTooltip ? { visible: false } : {});
  const popoverMenuConfig = makeNodeViewMenuConfig(props);
  return (
    <span>
      <HelpTooltip title={tooltipText} {...tooltipProps}>
        <button
          type="button"
          onClick={onClick}
          onKeyPress={e => callbackOnKeyPress(e, 'v', () => onNodeView(nodeKey))}
          className="title-button"
        >
          {title}
        </button>
      </HelpTooltip>
      {popoverMenuConfig.length > 0 ? (
        <PopoverMenu
          menuConfig={makeNodeViewMenuConfig(props)}
          onClose={() => {}}
          color={level > 0 ? color : null}
          setColor={c => onNodeSetColor(nodeKey, c)}
        >
          <MenuSVG className="node-menu-icon" />
        </PopoverMenu>
      ) : null}
      {level > 0 && isChecking ? checkbox : null}
    </span>
  );
}

function NamedSetNodeEditing(props) {
  const {
    title,
    nodeKey,
    onNodeSetName,
  } = props;
  const [currentTitle, setCurrentTitle] = useState(title);
  useEffect(() => {
    setCurrentTitle(title);
  }, [title]);
  return (
    <span className="title-button-with-input">
      <input
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
        className="title-input"
        type="text"
        value={currentTitle}
        onChange={(e) => { setCurrentTitle(e.target.value); }}
        onKeyPress={e => callbackOnKeyPress(
          e,
          'Enter',
          () => onNodeSetName(nodeKey, currentTitle, true),
        )}
        onFocus={e => e.target.select()}
      />
      <button
        type="button"
        className="title-save-button"
        onClick={() => onNodeSetName(nodeKey, currentTitle, true)}
      >
        Save
      </button>
    </span>
  );
}

function NamedSetNode(props) {
  const {
    isEditing,
    isCurrentSet,
  } = props;
  return (
    (isEditing || isCurrentSet)
      ? (<NamedSetNodeEditing {...props} />)
      : (<NamedSetNodeStatic {...props} />)
  );
}

function LevelsButtons(props) {
  const {
    nodeKey,
    height,
    onCheckLevel,
    checkedLevelKey,
    checkedLevelIndex,
  } = props;
  function onCheck(event) {
    if (event.target.checked) {
      const newLevel = parseInt(event.target.value, 10);
      onCheckLevel(nodeKey, newLevel);
    }
  }
  return (
    <div className="level-buttons-container">
      {range(1, height + 1).map(i => (
        <div className="level-buttons" key={i}>
          {i === 1 ? (<div className="level-line-zero" />) : null}
          <div className="level-line" />
          <HelpTooltip title={getLevelTooltipText(i)}>
            <input
              className="level-radio-button"
              type="checkbox"
              value={i}
              checked={nodeKey === checkedLevelKey && i === checkedLevelIndex}
              onChange={onCheck}
            />
          </HelpTooltip>
        </div>
      ))}
    </div>
  );
}

function SwitcherIcon(props) {
  const {
    isLeaf, isOpen, color,
  } = props;
  const hexColor = (color ? toHexString(color) : undefined);
  if (isLeaf) {
    return (
      <i
        className="anticon anticon-circle rc-tree-switcher-icon"
      >
        <svg
          viewBox="0 0 1024 1024"
          focusable="false"
          data-icon="caret-down"
          width="1em"
          height="1em"
          aria-hidden="true"
        >
          <rect fill={hexColor} x={600 / 2} y={600 / 2} width={1024 - 600} height={1024 - 600} />
        </svg>
      </i>
    );
  }
  return (
    <i
      className="anticon anticon-caret-down rc-tree-switcher-icon"
    >
      <svg
        viewBox="0 0 1024 1024"
        focusable="false"
        data-icon="caret-down"
        width="1em"
        height="1em"
        aria-hidden="true"
      >
        <path
          fill={(isOpen ? '#444' : hexColor)}
          d="M840.4 300H183.6c-19.7 0-30.7 20.8-18.5 35l328.4 380.8c9.4 10.9 27.5 10.9 37 0L858.9 335c12.2-14.2 1.2-35-18.5-35z"
        />
      </svg>
    </i>
  );
}

export default class TreeNode extends RcTreeNode {
  renderSelector = () => {
    const {
      title,
      isCurrentSet,
      isSelected,
      isEditing,
      onDragStart: onDragStartProp,
    } = this.props;
    const {
      rcTree: {
        prefixCls: prefixClass,
        draggable,
      },
    } = this.context;

    const onDragStart = (e) => {
      onDragStartProp();
      this.onDragStart(e);
    };

    const wrapClass = `${prefixClass}-node-content-wrapper`;
    const isDraggable = (!isCurrentSet && !isEditing && draggable);
    return (
      <span
        ref={this.setSelectHandle}
        title={title}
        className={classNames(
          wrapClass,
          `${wrapClass}-${this.getNodeState() || 'normal'}`,
          isSelected && `${prefixClass}-node-selected`,
          isDraggable && 'draggable',
        )}
        draggable={isDraggable}
        aria-grabbed={isDraggable}
        onDragStart={isDraggable ? onDragStart : undefined}
      >
        <NamedSetNode
          {...this.props}
          prefixClass={prefixClass}
          checkbox={this.renderCheckbox()}
        />
        {this.renderLevels()}
      </span>
    );
  };

  renderLevels = () => {
    const { level, expanded } = this.props;
    if (level !== 0 || expanded) {
      return null;
    }
    return (
      <LevelsButtons
        {...this.props}
      />
    );
  }

  renderSwitcher = () => {
    const { expanded, isLeaf, color } = this.props;
    const {
      rcTree: {
        prefixCls: prefixClass,
        onNodeExpand,
      },
    } = this.context;

    const switcherClass = classNames(
      `${prefixClass}-switcher`,
      { [`${prefixClass}-switcher_${(expanded ? 'open' : 'close')}`]: !isLeaf },
    );
    return (
      <span
        className={switcherClass}
        onClick={e => onNodeExpand(e, this)}
        onKeyPress={e => callbackOnKeyPress(e, 'd', () => {
          onNodeExpand(e, this);
        })}
        role="button"
        tabIndex="0"
      >
        <SwitcherIcon
          isLeaf={isLeaf}
          isOpen={expanded}
          color={color}
        />
      </span>
    );
  };

  render() {
    const {
      style, loading, level,
      dragOver, dragOverGapTop, dragOverGapBottom,
      isLeaf,
      expanded, selected, checked, halfChecked,
      onDragEnd: onDragEndProp,
      expandable,
      ...otherProps
    } = this.props;
    const {
      rcTree: {
        prefixCls: prefixClass,
        filterTreeNode,
        draggable,
      },
    } = this.context;
    const disabled = this.isDisabled();
    const dataAndAriaAttributeProps = getDataAndAria(otherProps);

    const onDragEnd = (e) => {
      onDragEndProp();
      this.onDragEnd(e);
    };

    return (
      <li
        className={classNames('rc-tree-treenode', `level-${level}-treenode`, {
          [`${prefixClass}-treenode-disabled`]: disabled,
          [`${prefixClass}-treenode-switcher-${expanded ? 'open' : 'close'}`]: !isLeaf,
          [`${prefixClass}-treenode-checkbox-checked`]: checked,
          [`${prefixClass}-treenode-checkbox-indeterminate`]: halfChecked,
          [`${prefixClass}-treenode-selected`]: selected,
          [`${prefixClass}-treenode-loading`]: loading,

          'drag-over': !disabled && dragOver,
          'drag-over-gap-top': !disabled && dragOverGapTop,
          'drag-over-gap-bottom': !disabled && dragOverGapBottom,
          'filter-node': filterTreeNode && filterTreeNode(this),
        })}
        style={style}
        role="treeitem"
        onDragEnter={draggable ? this.onDragEnter : undefined}
        onDragOver={draggable ? this.onDragOver : undefined}
        onDragLeave={draggable ? this.onDragLeave : undefined}
        onDrop={draggable ? this.onDrop.bind(this) : undefined}
        onDragEnd={draggable ? onDragEnd : undefined}
        {...dataAndAriaAttributeProps}
      >
        {expandable ? this.renderSwitcher() : null}
        {this.renderSelector()}
        {this.renderChildren()}
      </li>
    );
  }
}
