import {
  ReactFlow,
  addEdge,
  Background,
  Panel,
  BackgroundVariant,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
  ReactFlowProvider,
  MarkerType,
  getIncomers,
  getOutgoers,
  useReactFlow,
  BaseEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@blueprintjs/core";
import "../../styles/ReactFlowWindow.css";
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import StartNode from "./nodes/StartNode";
import MidNode from "./nodes/MidNode";
import DummyEndNode from "./nodes/DummyEndNode";
import AddEdge from "./edges/AddEdge";
import AddWithBranchEdge from "./edges/AddWithBranchEdge";
import JSONPretty from "react-json-pretty";

const initialNodes = [
  {
    id: "1",
    type: "start-node",
    data: { label: "Start Node" },
    deletable: false,
    style: { width: "200px", height: "40px" },
    position: { x: 0, y: 0 },
  },
  {
    id: "2",
    type: "dummy-end-node",
    data: { label: "End Node" },
    deletable: false,
    style: { borderRadius: "50%", width: "35px", height: "35px" },
    position: { x: 82.5, y: 100 },
  },
];

const nodeTypes = {
  "start-node": StartNode,
  "mid-node": MidNode,
  "dummy-end-node": DummyEndNode,
};

const edgeTypes = {
  "default-edge": BaseEdge,
  "add-edge": AddEdge,
  "add-with-branch-edge": AddWithBranchEdge,
};

function FlowProvider() {
  return (
    <ReactFlowProvider>
      <ReactFlowWindow />
    </ReactFlowProvider>
  );
}

function ReactFlowWindow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [maxNodeId, setMaxNodeId] = useState(initialNodes.length);
  const ref = useRef();
  const [rfInstance, setRfInstance] = useState(null);
  const { getEdge, getNode, getEdges } = useReactFlow();
  const [jsonData, setJsonData] = useState("");

  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge({ ...params, markerEnd: { type: MarkerType.Arrow } }, eds)
      ),
    [setEdges]
  );

  const addNode = useCallback(
    (nodeJson) => {
      setMaxNodeId((prevMaxNodeId) => {
        const newMaxNodeId = prevMaxNodeId + 1;
        const newNode = nodeJson;
        setNodes((nds) => nds.concat(newNode));
        return newMaxNodeId;
      });
    },
    [setNodes]
  );

  const getChildrenNodes = (nodeId, nodes, edges) => {
    const children = new Set();

    const findChildren = (currentNodeId) => {
      edges
        .filter((edge) => edge.source === currentNodeId)
        .forEach((edge) => {
          if (edge.target !== undefined) {
            const childNode = nodes.find((node) => node.id === edge.target);
            if (childNode !== undefined) {
              children.add(childNode.id);
              findChildren(childNode.id);
            }
          }
        });
    };

    findChildren(nodeId);

    return Array.from(children);
  };

  const moveNode = useCallback(
    (nodeId, x, y) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              position: {
                x: node.position.x + x,
                y: node.position.y + y,
              },
            };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  const onAddEdgeClick = useCallback(
    (edgeId, nodeDataType) => {
      setMaxNodeId((prevMaxNodeId) => {
        let newMaxNodeId = prevMaxNodeId;

        const oldSourceNode = getNode(getEdge(edgeId).source);
        const oldTargetNode = getNode(getEdge(edgeId).target);

        if (nodeDataType === "Logic") {
          newMaxNodeId = addLogicNode(
            newMaxNodeId,
            oldSourceNode,
            oldTargetNode,
            edgeId
          );
        } else if ([].includes(nodeDataType)) { // 타겟노드 없이 끝나는 노드 타입 추가, 단 중간에 생성될 수 없음 (oldTargetNode의 타겟이 항상 DummyEndNode)
          if(oldTargetNode.type !== "dummy-end-node") {
            console.log("Invalid nodeDataType");
            return newMaxNodeId;
          } else {
            newMaxNodeId = addEndNode(
              newMaxNodeId,
              oldSourceNode,
              oldTargetNode,
              edgeId,
              nodeDataType
            );
          }
        } else {
          newMaxNodeId = addNormalNode(
            newMaxNodeId,
            oldSourceNode,
            oldTargetNode,
            edgeId,
            nodeDataType
          );
        }

        return newMaxNodeId;
      });
    },
    [getEdge, getNode, setNodes]
  );

  const addNormalNode = (
    newMaxNodeId,
    oldSourceNode,
    oldTargetNode,
    edgeId,
    nodeDataType
  ) => {
    // set new node

    newMaxNodeId++;

    const newNode = {
      id: newMaxNodeId.toString(),
      type: "mid-node",
      data: {
        label: `${nodeDataType} Node ${newMaxNodeId}`,
        nodeDataType: nodeDataType,
      },
      style: { width: "200px", height: "50px" },
      position: {
        x: oldSourceNode.position.x,
        y: oldSourceNode.position.y + 100,
      },
    };

    // add node

    setNodes((nds) => nds.concat(newNode));

    // set new edge

    // 기존 노드와 새로운 노드를 연결하는 엣지 추가, 완전 신규 엣지
    const newEdge = {
      source: newNode.id,
      target: oldTargetNode.id,
      type: nodeDataType === "Logic" ? "add-with-branch-edge" : "add-edge",
      id: `xy-edge__${newNode.id}-${oldTargetNode.id}`,
      deletable: false,
      data: { onAddEdgeClick },
    };

    let newEdges = [];

    setEdges((eds) => {
      newEdges = [...eds, newEdge];
      return [...eds, newEdge];
    });

    // set modified edge

    newEdges = [...getEdges(), newEdge];

    // 새로운 노드와 기존 타겟 노드를 연결하는 엣지 추가, 수정된 엣지
    setEdges((eds) =>
      eds.map((edge) => {
        console.log(edge);
        if (edge.id === edgeId) {
          return {
            ...edge,
            source: oldSourceNode.id,
            target: newNode.id,
            id: `xy-edge__${oldSourceNode.id}-${newNode.id}`,
            deletable: false,
            data: { onAddEdgeClick },
          };
        }
        return edge;
      })
    );
    // reposition nodes
    setNodes((nds) =>
      nds.map((node) => {
        if (
          getChildrenNodes(oldSourceNode.id, nds, getEdges()).includes(
            node.id
          ) &&
          node.id !== newNode.id
        ) {
          return {
            ...node,
            position: {
              x: node.position.x,
              y: node.position.y + 100,
            },
          };
        }
        return node;
      })
    );

    return newMaxNodeId;
  };

  const addLogicNode = (newMaxNodeId, oldSourceNode, oldTargetNode, edgeId) => {
    // set new nodes

    const newNodes = [];
    let newEdges = [];

    // if oldTargetNode is a dummy end node, then we need to add a new dummy end node for children nodes.

    newMaxNodeId++;

    const newParentNode = {
      id: newMaxNodeId.toString(),
      type: "mid-node",
      data: {
        label: `Logic Node ${newMaxNodeId}`,
        nodeDataType: "Logic-Parent",
      },
      style: { width: "200px", height: "50px" },
      position: {
        x: oldSourceNode.position.x,
        y: oldSourceNode.position.y + 100,
      },
    };
    newNodes.push(newParentNode);

    newMaxNodeId++;

    const newLeftNode = {
      id: newMaxNodeId.toString(),
      type: "mid-node",
      data: {
        label: `Logic Node ${newMaxNodeId}`,
        nodeDataType: "Logic-Parent",
      },
      style: { width: "200px", height: "50px" },
      position: {
        x: newParentNode.position.x - 100,
        y: newParentNode.position.y + 100,
      },
    };
    newNodes.push(newLeftNode);

    newMaxNodeId++;

    // newRightNode의 위치는 newParentNode의 오른쪽에 위치
    const newRightNode = {
      id: newMaxNodeId.toString(),
      type: "mid-node",
      data: {
        label: `Logic Node ${newMaxNodeId}`,
        nodeDataType: "Logic-Parent",
      },
      style: { width: "200px", height: "50px" },
      position: {
        x: newParentNode.position.x + 100,
        y: newParentNode.position.y + 100,
      },
    };
    newNodes.push(newRightNode);

    newMaxNodeId++;

    const newRightEndNode = {
      id: newMaxNodeId.toString(),
      type: "dummy-end-node",
      data: { label: `End Node ${newMaxNodeId}` },
      deletable: false,
      style: { borderRadius: "50%", width: "35px", height: "35px" },
      position: {
        x: newRightNode.position.x + 82.5,
        y: newRightNode.position.y + 100,
      },
    };
    newNodes.push(newRightEndNode);

    // add new nodes
    setNodes((nds) => nds.concat(newNodes));

    // set edges
    const newEdgesToAdd = [
      {
        source: newParentNode.id,
        target: newLeftNode.id,
        type: "bezier",
        id: `xy-edge__${newParentNode.id}-${newLeftNode.id}`,
        deletable: false,
        data: { onAddEdgeClick },
      },
      {
        source: newParentNode.id,
        target: newRightNode.id,
        type: "bezier",
        id: `xy-edge__${newParentNode.id}-${newRightNode.id}`,
        deletable: false,
        data: { onAddEdgeClick },
      },
      {
        source: newLeftNode.id,
        target: oldTargetNode.id,
        type: "add-edge",
        id: `xy-edge__${newLeftNode.id}-${oldTargetNode.id}`,
        deletable: false,
        data: { onAddEdgeClick },
      },
      {
        source: newRightNode.id,
        target: newRightEndNode.id,
        type: "add-edge",
        id: `xy-edge__${newRightNode.id}-${newRightEndNode.id}`,
        deletable: false,
        data: { onAddEdgeClick },
      },
    ];

    newEdges = [...getEdges(), ...newEdgesToAdd];

    setEdges((eds) => {
      return [...getEdges(), ...newEdgesToAdd];
    });

    console.log(newEdges);

    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.id === edgeId) {
          return {
            ...edge,
            source: oldSourceNode.id,
            target: newParentNode.id,
            id: `xy-edge__${oldSourceNode.id}-${newParentNode.id}`,
            deletable: false,
            data: { onAddEdgeClick },
          };
        }
        return edge;
      })
    );

    // reposition nodes
    setNodes((nds) =>
      nds.map((node) => {
        if (
          getChildrenNodes(oldSourceNode.id, nds, newEdges).includes(node.id) &&
          !newNodes.map((n) => n.id).includes(node.id)
        ) {
          return {
            ...node,
            position: {
              x:
                node.position.x +
                (newLeftNode.position.x - oldSourceNode.position.x),
              y:
                node.position.y +
                (newLeftNode.position.y - oldSourceNode.position.y),
            },
          };
        }
        return node;
      })
    );

    return newMaxNodeId;
  };

  const addEndNode = (newMaxNodeId) => {
    // add new end node

    // set Edge


    return newMaxNodeId;
  }

  const onNodesDelete = useCallback(
    (deletedNodes) => {
      setEdges((eds) =>
        eds.reduce((acc, edge) => {
          const deletedIds = new Set(deletedNodes.map((n) => n.id));
          if (!deletedIds.has(edge.source) && !deletedIds.has(edge.target)) {
            return [...acc, edge];
          }
          return acc;
        }, [])
      );

      deletedNodes.forEach((node) => {
        const incomers = getIncomers(node, nodes, edges);
        const outgoers = getOutgoers(node, nodes, edges);

        // 바로 다음 노드가 dummy-end-node인 경우, 해당 노드를 삭제하고, 해당 노드와 연결된 엣지도 삭제
        if (outgoers[0].type === "dummy-end-node") {
          setEdges((eds) =>
            eds.filter((edge) => edge.target !== outgoers[0].id)
          );

          setNodes((nds) => nds.filter((n) => n.id !== outgoers[0].id));
        } else {
          incomers.forEach((inNode) => {
            getChildrenNodes(inNode.id, nodes, edges).forEach((childNode) => {
              moveNode(childNode.id, 0, -100);
            });
          });

          setEdges((eds) =>
            eds.concat(
              incomers.flatMap(({ id: source }) =>
                outgoers.map(({ id: target }) => ({
                  source,
                  target,
                  type: "add-edge",
                  id: `xy-edge__${source}-${target}`,
                  deletable: false,
                  data: { onAddEdgeClick },
                }))
              )
            )
          );
        }
      });
    },
    [nodes, edges, onAddEdgeClick, getChildrenNodes, moveNode]
  );

  const exportToJson = useCallback(() => {
    if (rfInstance) {
      const flow = rfInstance.toObject();
      setJsonData(JSON.stringify(flow));
    }
  }, [rfInstance]);

  const showNodeInfo = (node) => {
    ref.current.resize([100, 100]);
  };

  const initialEdges = useMemo(
    () => [
      {
        source: "1",
        target: "2",
        type: "add-edge",
        id: "xy-edge__1-2",
        deletable: false,
        data: { onAddEdgeClick },
      },
    ],
    [onAddEdgeClick]
  );

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Allotment ref={ref} defaultSizes={[100, 0]}>
        <Allotment.Pane
          className="split-left-view"
          minSize={50}
          style={{ height: "50px" }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodeClick={(event, node) => showNodeInfo(node)}
            onPaneClick={() => ref.current.resize([100, 0])}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodesDelete={onNodesDelete}
            onConnect={onConnect}
            onInit={setRfInstance}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={{ type: "add-edge" }}
            fitView
          >
            <MiniMap />
            <Panel />
            <Controls />
            <Background variant={BackgroundVariant.Cross} />
            <Button
              intent="primary"
              onClick={exportToJson}
              style={{
                position: "absolute",
                right: 10,
                top: 50,
                zIndex: 1000,
              }}
            >
              Export to JSON
            </Button>
          </ReactFlow>
        </Allotment.Pane>
        <Allotment.Pane
          className="split-right-view"
          minSize={0}
          maxSize={500}
          style={{ overflow: "auto" }}
        >
          <div
            className="menu-bar"
            style={{ overflow: "auto", height: "auto" }}
          >
            <JSONPretty
              id="json-pretty"
              data={jsonData}
              style={{ overflow: "auto", height: "auto" }}
            ></JSONPretty>
          </div>
        </Allotment.Pane>
      </Allotment>
    </div>
  );
}

export default FlowProvider;
