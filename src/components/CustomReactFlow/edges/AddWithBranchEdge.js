import React from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
} from "@xyflow/react";
import "../../../styles/ReactFlowEdge.css";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";

function AddWithBranchEdge({
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
  const handleAddBranchClick = () => {
    if (data && data.onAddBranchClick) {
      data.onAddBranchClick(id);
    }
  };

  // Custom path to create the intermediate diamond shape
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX: sourceX,
    targetY: sourceY + (targetY - sourceY) / 3,
    targetPosition,
  });

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

  const [midEdgePath] = getBezierPath({
    sourceX: sourceX,
    sourceY: sourceY + (targetY - sourceY) / 3,
    sourcePosition,
    targetX: sourceX,
    targetY: sourceY + (targetY - sourceY) / 3 * 2,
    targetPosition,
  });

  const [endEdgePath] = getBezierPath({
    sourceX: sourceX,
    sourceY: sourceY + (targetY - sourceY) / 3 * 2,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Calculate the positions for the buttons at 1/3 and 2/3 points
  const button1X = sourceX;
  const button1Y = sourceY + (targetY - sourceY) / 3;

  const button2X = sourceX;
  const button2Y = sourceY + (targetY - sourceY) / 3 * 2;

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${button1X}px,${button1Y}px)`,
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
            style={{
              padding: "0",
              borderRadius: "50%",
              border: "1px solid #000",
            }}
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
      <BaseEdge path={midEdgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${button2X}px,${button2Y}px)`,
            fontSize: 12,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
        >
          <button
            id="add-branch-button"
            className="edgebutton"
            onClick={handleAddBranchClick}
            style={{
              width: "13px",
              height: "13px",
              padding: "0",
              borderRadius: "0%",
              border: "1px solid #000",
              transform: "rotate(45deg)", // 마름모꼴 모양 만들기
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
          <span style={{
            display: "inline-block",
            transform: "rotate(-45deg)", // 글씨를 45도 회전시키기
          }}>+</span>
          </button>
        </div>
      </EdgeLabelRenderer>
      <BaseEdge path={endEdgePath} markerEnd={markerEnd} style={style} />
    </>
  );
}

export default AddWithBranchEdge;
