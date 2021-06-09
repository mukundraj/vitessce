/* eslint-disable */
import { makeStyles } from '@material-ui/core/styles';

export const useStyles = makeStyles(() => ({
  appContainer: {
    backgroundColor: 'blue',
    boxSizing: 'border-box',
    width: '100%',
    height: '100%',
  },
  sidebarContainer: {
    backgroundColor: 'rgb(230, 230, 230)',
    width: '36px',
    height: '100vh',
    float: 'left',
    '& svg': {
      width: '26px',
      height: '26px',
      padding: '5px',
    }
  },
  topLink: {
    marginBottom: '10px',
  },
  actionContainer: {
    position: 'relative',
    '& svg': {
      color: 'rgb(103, 103, 103)',
      cursor: 'pointer',
    },
    '& svg:hover': {
      color: 'rgb(34, 34, 34)',
    },
    '& svg:hover + ul': {
      display: 'block',
    },
    '& > ul:hover': {
      display: 'block',
    },
    '& ul': {
      float: 'right',
      overflow: 'visible',
      position: 'absolute',
      zIndex: 100,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      boxShadow: '4px 4px 10px rgba(0, 0, 0, 0.5)',
      marginLeft: '2px',
      borderRadius: '4px',
      padding: '4px',
      whiteSpace: 'nowrap',
      verticalAlign: 'middle',
      marginTop: '6px',
    },
    '& > ul': {
      display: 'none',
      top: '-3px',
      left: '36px',
    },
    '& > ul::before': {
      content: '""',
      width: '2px',
      backgroundColor: 'transparent',
      height: '100%',
      left: '-2px',
      top: 0,
      position: 'absolute',
    },
    '& > ul li ul::before': {
      content: '""',
      width: '100%',
      backgroundColor: 'transparent',
      height: '2px',
      top: '-2px',
      left: 0,
      position: 'absolute',
    },
  },
  mainContainer: {
    width: 'calc(100% - 36px)',
    height: '100%',
    float: 'left',
  },
  treeRoot: {
    flexGrow: 1,
  },
  treeItemLabel: {
    backgroundColor: 'transparent !important',
    paddingRight: '5px',
  },
  treeItemIconContainer: {
    maxWidth: '15px',
    width: 'auto',
    '& > svg': {
      height: '18px',
    }
  }
}));
