import React from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
} from "@xyflow/react";
import "../../../styles/ReactFlowEdge.css";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Button from '@mui/material/Button';

function AddEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const onAddEdgeClick = (type) => () => {
    if (data && data.onAddEdgeClick) {
      data.onAddEdgeClick(id, type);
    }
    handleClose();
  };

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
        >
          <button
            id="add-edge-button"
            className="edge-button"
            aria-controls={open ? "add-node-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={open ? "true" : undefined}
            onClick={handleClick}
          >
            +
          </button>
          <Menu
            id="add-node-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            MenuListProps={{
              'aria-labelledby': 'add-edge-button',
            }}
          >
            <MenuItem onClick={onAddEdgeClick("Message")}>Message</MenuItem>
            <MenuItem onClick={onAddEdgeClick("CollectInformation")}>
              Collect Information
            </MenuItem>
            <MenuItem onClick={onAddEdgeClick("CustomAction")}>
              Custom Action
            </MenuItem>
            <MenuItem onClick={onAddEdgeClick("Logic")}>Logic</MenuItem>
            <MenuItem onClick={onAddEdgeClick("SetSlots")}>Set Slots</MenuItem>
            <MenuItem onClick={onAddEdgeClick("Link")}>Link</MenuItem>
          </Menu>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default AddEdge;
