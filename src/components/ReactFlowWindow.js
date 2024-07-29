import {
  ReactFlow,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
  ReactFlowProvider,
  MarkerType,
  NodeToolbar,
  useReactFlow,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import React, { useCallback, useState, useRef, useEffect } from "react";
import { Button } from "@blueprintjs/core";
import CircularIcon from "./CircularIcon";
import "../styles/ReactFlowWindow.css";

const iconSize = 30;
const iconPosition = "right";

const initialNodes = [
  {
    id: "1",
    type: "input-node-with-toolbar",
    data: { label: "Input Node" },
    position: { x: 250, y: 0 },
  },
  {
    id: "2",
    data: { label: "Default Node" },
    type: "node-with-toolbar",
    position: { x: 100, y: 100 },
  },
  {
    id: "3",
    type: "output-node-with-toolbar",
    data: { label: "Output Node" },
    position: { x: 400, y: 100 },
  },
];

const initialEdges = [];

const nodeTypes = {
  "node-with-toolbar": NodeWithToolbar,
  "input-node-with-toolbar": InputNodeWithToolbar,
  "output-node-with-toolbar": OutputNodeWithToolbar,
};

function FlowProvider() {
  return (
    <ReactFlowProvider>
      <ReactFlowWindow />
    </ReactFlowProvider>
  );
}

function NodeWithToolbar({ data }) {
  return (
    <>
      <NodeToolbar
        isVisible={data.forceToolbarVisible || undefined}
        position={iconPosition}
      >
        <CircularIcon size={iconSize} icon="edit" />
        <CircularIcon size={iconSize} icon="trash" />
        <CircularIcon size={iconSize} icon="calendar" />
      </NodeToolbar>
      <div>{data?.label}</div>

      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}

function InputNodeWithToolbar({ data }) {
  console.log(data.toolbarPosition);
  return (
    <>
      <NodeToolbar
        isVisible={data.forceToolbarVisible || undefined}
        position={iconPosition}
      >
        <CircularIcon size={iconSize} icon="edit" />
        <CircularIcon size={iconSize} icon="trash" />
        <CircularIcon size={iconSize} icon="calendar" />
      </NodeToolbar>
      <div>{data?.label}</div>

      <Handle type="source" position={Position.Bottom} />
    </>
  );
}

function OutputNodeWithToolbar({ data }) {
  return (
    <>
      <NodeToolbar
        isVisible={data.forceToolbarVisible || undefined}
        position={iconPosition}
      >
        <CircularIcon size={iconSize} icon="edit" />
        <CircularIcon size={iconSize} icon="trash" />
        <CircularIcon size={iconSize} icon="calendar" />
      </NodeToolbar>
      <div>{data?.label}</div>

      <Handle type="target" position={Position.Top} />
    </>
  );
}

function ReactFlowWindow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge({ ...params, markerEnd: { type: MarkerType.Arrow } }, eds)
      ),
    [setEdges]
  );

  const addNode = () => {
    const newNode = {
      id: (nodes.length + 1).toString(),
      data: { label: `Node ${nodes.length + 1}` },
      position: { x: Math.random() * 400, y: Math.random() * 400 },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const removeNode = (nodeId) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) =>
      eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
    );
  };

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <MiniMap />
        <Controls />
        <Background />

        <Button
          icon="add"
          intent="primary"
          onClick={addNode}
          style={{
            position: "absolute",
            float: "right",
            margin: "10px",
            zIndex: 1000,
          }}
        >
          Add Node
        </Button>
      </ReactFlow>
    </div>
  );
}

export default FlowProvider;
