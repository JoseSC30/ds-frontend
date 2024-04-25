import { ReactDiagram } from 'gojs-react';
import * as go from 'gojs';

function initDiagram() {
  const $ = go.GraphObject.make;
  const diagram = $(go.Diagram, {
    'undoManager.isEnabled': true,
    'undoManager.maxHistoryLength': 0,
    // 'clickCreatingTool.archetypeNodeData': { text: 'new node', color: 'lightblue' },
    'clickCreatingTool.archetypeNodeData': { category: 'Actor'},
    'grid.visible': true,
    // model: new go.GraphLinksModel({ linkKeyProperty: 'key' })
    model: $(go.GraphLinksModel,
    {
      linkKeyProperty: 'key',  // IMPORTANT! must be defined for merges and data sync when using GraphLinksModel
      linkFromPortIdProperty: 'fromPort',
      linkToPortIdProperty: 'toPort',
      // nodeDataArray: [
      //   { key: 1, category: 'Actor', text: 'Actor 1', color: 'lightblue'},
      //   { key: 2, category: 'Action', text: 'Action 1', color: 'green'},
      //   { key: 3, category: 'Actor', text: 'Actor 2', color: 'lightblue'},
      // ],
      // linkDataArray: [
      //   { from: 1, to: 2, fromPort: 'B', toPort: 'T' },
      //   { from: 2, to: 3, fromPort: 'B', toPort: 'T' },
      // ]
    })
  });

  diagram.nodeTemplate = $(go.Node, 'Auto',
    new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
    $(go.Shape, 'RoundedRectangle', { name: 'SHAPE', fill: 'white', strokeWidth: 0 },
      new go.Binding('fill', 'color')),
    $(go.TextBlock, { margin: 8, editable: true },
      new go.Binding('text').makeTwoWay())
  );

  diagram.nodeTemplateMap.add('Actor',
    $(go.Node, 'Vertical',
      $(go.TextBlock, { margin: 8 },
        new go.Binding('text')),
      $(go.Shape, 'Rectangle', { fill: 'white' })
    )
  );

  diagram.nodeTemplateMap.add('Action',
    $(go.Node, 'Auto',
      $(go.Shape, 'Rectangle', { fill: 'lightyellow' }),
      $(go.TextBlock, { margin: 8 },
        new go.Binding('text'))
    )
  )

  return diagram;
}

function Diagram() {
  const nodeDataArray = [
    { key: 1, category: 'Actor', text: 'Actor 1', color: 'lightblue'},
    { key: 2, category: 'Action', text: 'Action 1', color: 'green'},
    { key: 3, category: 'Actor', text: 'Actor 2', color: 'lightblue'},
  ];
 const linkDataArray = [
    { from: 1, to: 2, fromPort: 'B', toPort: 'T' },
    { from: 2, to: 3, fromPort: 'B', toPort: 'T' },
  ];
  return (
    <ReactDiagram
      initDiagram={initDiagram}
      divClassName='diagram-component'
      nodeDataArray={nodeDataArray}
      linkDataArray={linkDataArray}
    />
  );
}

export default Diagram;
