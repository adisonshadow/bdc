import React, { useEffect, useState, useRef } from "react";
import cytoscape from "cytoscape";

// https://github.com/shichuanpo/cytoscape.js-d3-force
import d3Force from "cytoscape-d3-force";
// https://github.com/cytoscape/cytoscape.js-cola
const cola = require("cytoscape-cola");
import { Button, Drawer, Descriptions, Tag, Space, Typography, Checkbox, Card, Select } from "antd";
import { RollbackOutlined, OneToOneOutlined, DownloadOutlined, GatewayOutlined } from "@ant-design/icons";
import { getSchemas } from "@/services/BDC/api/schemaManagement";
import { getEnums } from "@/services/BDC/api/enumManagement";

// 注册插件
cytoscape.use(d3Force);
cytoscape.use(cola);

// 添加 JSX 类型声明
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

const { Title, Text } = Typography;

const SchemaGraphNew2: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState('');
  const [drawerContent, setDrawerContent] = useState<any>(null);
  const [schemas, setSchemas] = useState<any[]>([]);
  const [enums, setEnums] = useState<any[]>([]);
  const [hideEnums, setHideEnums] = useState(false);
  const [currentLayout, setCurrentLayout] = useState<string>('cola');
  const cyRef = useRef<any>(null);

  // 布局选项
  const layoutOptions = [
    // { value: 'd3-force', label: 'D3 Force' },
    { value: 'cola', label: 'Cola' },
    // { value: 'cose', label: 'Cose' },
    // { value: 'concentric', label: 'Concentric' },
    // { value: 'grid', label: 'Grid' }
  ];

  // 获取布局配置
  const getLayoutConfig = (layoutName: string) => {
    switch (layoutName) {
      // case 'd3-force':
      //   return {
      //     name: 'd3-force',
      //     animate: true,
      //     maxIterations: 1000,
      //     maxSimulationTime: 100,
      //     ungrabifyWhileSimulating: false,
      //     fixedAfterDragging: false,
      //     fit: true,
      //     padding: 50,
      //     alpha: 1,
      //     alphaMin: 0.001,
      //     alphaDecay: 0.02,
      //     alphaTarget: 0,
      //     velocityDecay: 0.4,
      //     collideRadius: (nodeData: any) => nodeData?.radius || 60,
      //     collideStrength: 0.8,
      //     collideIterations: 1,
      //     linkId: (edgeData: any) => edgeData?.id,
      //     linkDistance: 200,
      //     linkStrength: 0.5,
      //     linkIterations: 1,
      //     manyBodyStrength: -500,
      //     manyBodyTheta: 0.9,
      //     manyBodyDistanceMin: 1,
      //     manyBodyDistanceMax: undefined,
      //     xStrength: 0.1,
      //     xX: (el: any) => 0,
      //     yStrength: 0.1,
      //     yY: (el: any) => 0,
      //     radialStrength: undefined,
      //     radialRadius: undefined,
      //     radialX: undefined,
      //     radialY: undefined,
      //     ready: function() {
      //       console.log('D3 Force 布局完成');
      //     },
      //     stop: function() {
      //       console.log('D3 Force 布局停止');
      //     },
      //     tick: function() {},
      //     randomize: true,
      //     infinite: false
      //   };
      case 'cola':
        return {
          name: 'cola',
          animate: true,
          refresh: 1,
          maxSimulationTime: 4000,
          ungrabifyWhileSimulating: false,
          fit: true,
          padding: 30,
          nodeDimensionsIncludeLabels: false,
          ready: function() {
            console.log('Cola 布局完成');
          },
          stop: function() {
            console.log('Cola 布局停止');
          },
          randomize: false,
          avoidOverlap: true,
          handleDisconnected: true,
          convergenceThreshold: 0.01,
          nodeSpacing: function(node: any) { return 10; },
          flow: undefined,
          alignment: undefined,
          gapInequalities: undefined,
          centerGraph: true,
          edgeLength: 200,
          edgeSymDiffLength: undefined,
          edgeJaccardLength: undefined,
          unconstrIter: undefined,
          userConstIter: undefined,
          allConstIter: undefined
        };
      // case 'cose':
      //   return {
      //     name: 'cose',
      //     animate: true,
      //     animationDuration: 1000,
      //     nodeDimensionsIncludeLabels: true,
      //     fit: true,
      //     padding: 50,
      //     randomize: true,
      //     componentSpacing: 100,
      //     nodeRepulsion: (node: any) => 4000,
      //     nodeOverlap: 20,
      //     gravity: 80,
      //     numIter: 1000,
      //     initialTemp: 200,
      //     coolingFactor: 0.95,
      //     minTemp: 1.0,
      //     ready: function() {
      //       console.log('Cose 布局完成');
      //     },
      //     stop: function() {
      //       console.log('Cose 布局停止');
      //     }
      //   };
      // case 'concentric':
      //   return {
      //     name: 'concentric',
      //     animate: true,
      //     animationDuration: 1000,
      //     nodeDimensionsIncludeLabels: true,
      //     fit: true,
      //     padding: 50,
      //     startAngle: 3 / 2 * Math.PI,
      //     sweep: undefined,
      //     clockwise: false,
      //     equidistant: false,
      //     minNodeSpacing: 10,
      //     boundingBox: undefined,
      //     avoidOverlap: true,
      //     height: undefined,
      //     width: undefined,
      //     concentric: function(node: any) {
      //       return node.degree();
      //     },
      //     levelWidth: function(nodes: any) {
      //       return 2;
      //     },
      //     ready: function() {
      //       console.log('Concentric 布局完成');
      //     },
      //     stop: function() {
      //       console.log('Concentric 布局停止');
      //     }
      //   };
      // case 'grid':
      //   return {
      //     name: 'grid',
      //     animate: true,
      //     animationDuration: 1000,
      //     fit: true,
      //     padding: 50,
      //     boundingBox: undefined,
      //     avoidOverlap: true,
      //     avoidOverlapPadding: 10,
      //     nodeDimensionsIncludeLabels: false,
      //     spacingFactor: undefined,
      //     condense: false,
      //     rows: undefined,
      //     cols: undefined,
      //     position: function(node: any) {},
      //     sort: undefined,
      //     ready: function() {
      //       console.log('Grid 布局完成');
      //     },
      //     stop: function() {
      //       console.log('Grid 布局停止');
      //     }
      //   };
      default:
        return getLayoutConfig('cola');
    }
  };

  // 切换布局
  const handleLayoutChange = (layoutName: string) => {
    console.log('切换布局到:', layoutName);
    setCurrentLayout(layoutName);
    
    if (cyRef.current) {
      const cy = cyRef.current;
      const layoutConfig = getLayoutConfig(layoutName);
      
      cy.layout(layoutConfig).run();
    }
  };

  useEffect(() => {
    console.log('SchemaGraphNew2 组件挂载');
    console.log('cytoscape 模块:', cytoscape);
    
    // 延迟设置 loading 为 false，确保容器渲染完成
    const timer = setTimeout(() => {
      setLoading(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // 当 loading 变为 false 时初始化 cytoscape
  useEffect(() => {
    if (!loading) {
      console.log('loading 变为 false，开始初始化 cytoscape');
      setTimeout(() => {
        initCytoscape();
      }, 100);
    }
  }, [loading]);

  // 监听 drawerVisible 状态变化
  useEffect(() => {
    console.log('drawerVisible 状态变化:', drawerVisible);
    console.log('drawerTitle:', drawerTitle);
    console.log('drawerContent:', drawerContent);
  }, [drawerVisible, drawerTitle, drawerContent]);

  const showNodeDetails = (nodeData: any) => {
    console.log('showNodeDetails 被调用，nodeData:', nodeData);
    console.log('当前 schemas:', schemas);
    console.log('当前 enums:', enums);
    
    if (nodeData.type === 'schema') {
      const schema = schemas.find((s: any) => s.code === nodeData.id);
      console.log('找到的 schema:', schema);
      if (schema) {
        setDrawerTitle(`数据表: ${schema.name}`);
        setDrawerContent({
          type: 'schema',
          data: schema
        });
        setDrawerVisible(true);
        console.log('设置 Drawer 为可见');
      } else {
        console.error('未找到对应的 schema，nodeData.id:', nodeData.id);
        console.error('可用的 schemas:', schemas.map((s: any) => s.code));
      }
    } else if (nodeData.type === 'enum') {
      const enumItem = enums.find((e: any) => e.code === nodeData.id);
      console.log('找到的 enumItem:', enumItem);
      if (enumItem) {
        setDrawerTitle(`枚举: ${enumItem.name}`);
        setDrawerContent({
          type: 'enum',
          data: enumItem
        });
        setDrawerVisible(true);
        console.log('设置 Drawer 为可见');
      } else {
        console.error('未找到对应的 enumItem，nodeData.id:', nodeData.id);
        console.error('可用的 enums:', enums.map((e: any) => e.code));
      }
    }
  };

  const showNodeDetailsWithData = (nodeData: any, schemasData: any[], enumsData: any[]) => {
    console.log('showNodeDetailsWithData 被调用，nodeData:', nodeData);
    console.log('传入的 schemasData:', schemasData);
    console.log('传入的 enumsData:', enumsData);
    
    if (nodeData.type === 'schema') {
      const schema = schemasData.find((s: any) => s.code === nodeData.id);
      console.log('找到的 schema:', schema);
      if (schema) {
        setDrawerTitle(`数据表: ${schema.name}`);
        setDrawerContent({
          type: 'schema',
          data: schema
        });
        setDrawerVisible(true);
        console.log('设置 Drawer 为可见');
      } else {
        console.error('未找到对应的 schema，nodeData.id:', nodeData.id);
        console.error('可用的 schemas:', schemasData.map((s: any) => s.code));
      }
    } else if (nodeData.type === 'enum') {
      const enumItem = enumsData.find((e: any) => e.code === nodeData.id);
      console.log('找到的 enumItem:', enumItem);
      if (enumItem) {
        setDrawerTitle(`枚举: ${enumItem.name}`);
        setDrawerContent({
          type: 'enum',
          data: enumItem
        });
        setDrawerVisible(true);
        console.log('设置 Drawer 为可见');
      } else {
        console.error('未找到对应的 enumItem，nodeData.id:', nodeData.id);
        console.error('可用的 enums:', enumsData.map((e: any) => e.code));
      }
    }
  };

  const showEdgeDetails = (edgeData: any) => {
    console.log('showEdgeDetails 被调用，edgeData:', edgeData);
    setDrawerTitle(`关系: ${edgeData.label}`);
    setDrawerContent({
      type: 'edge',
      data: edgeData
    });
    setDrawerVisible(true);
    console.log('设置 Drawer 为可见');
  };

  const renderSchemaDetails = (schema: any) => {
    return (
      <div>
        <Descriptions column={1} bordered>
          <Descriptions.Item label="编码">{schema.code}</Descriptions.Item>
          <Descriptions.Item label="名称">{schema.name}</Descriptions.Item>
          <Descriptions.Item label="描述">{schema.description || '无'}</Descriptions.Item>
        </Descriptions>
        
        <Title level={4} style={{ marginTop: 24, marginBottom: 16 }}>字段列表</Title>
        {schema.fields && schema.fields.length > 0 ? (
          <div>
            {schema.fields.map((field: any, index: number) => (
              <div key={index} style={{ 
                borderRadius: 6, 
                padding: 12, 
                marginBottom: 8,
                background: '#fafafa0a'
              }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space>
                    <Text strong>{field.name}</Text>
                    <Tag color="blue">{field.type}</Tag>
                    {field.required && <Tag color="red">必填</Tag>}
                  </Space>
                  
                  {field.description && (
                    <div style={{ fontSize: '13.5px', lineHeight: '1.4', color: '#666', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {field.description}
                    </div>
                  )}
                  
                  {field.type === 'relation' && field.relationConfig && (
                    <div>
                      <Text type="secondary">关联到: {field.relationConfig.targetSchemaCode}</Text>
                      <br />
                      <Text type="secondary">多对多: {field.relationConfig.multiple ? '是' : '否'}</Text>
                    </div>
                  )}
                  
                  {field.type === 'enum' && field.enumConfig && (
                    <div>
                      <Text type="secondary">枚举: {field.enumConfig.targetEnumCode}</Text>
                      <br />
                      <Text type="secondary">多选: {field.enumConfig.multiple ? '是' : '否'}</Text>
                    </div>
                  )}
                </Space>
              </div>
            ))}
          </div>
        ) : (
          <Text type="secondary">暂无字段</Text>
        )}
      </div>
    );
  };

  const renderEnumDetails = (enumItem: any) => {
    return (
      <div>
        <Descriptions column={1} bordered>
          <Descriptions.Item label="编码">{enumItem.code}</Descriptions.Item>
          <Descriptions.Item label="名称">{enumItem.name}</Descriptions.Item>
          <Descriptions.Item label="描述">{enumItem.description || '无'}</Descriptions.Item>
        </Descriptions>
        
        <Title level={4} style={{ marginTop: 24, marginBottom: 16 }}>选项列表</Title>
        {enumItem.options && enumItem.options.length > 0 ? (
          <div>
            {enumItem.options.map((option: any, index: number) => (
              <div key={index} style={{ 
                borderRadius: 6, 
                padding: 12, 
                marginBottom: 8,
                background: '#fafafa0a'
              }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space>
                    <Text strong>{option.label}</Text>
                    <Tag color="green">{option.value}</Tag>
                  </Space>
                  
                  {option.description && (
                    <div style={{ fontSize: '13.5px', lineHeight: '1.4', color: '#666', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {option.description}
                    </div>
                  )}
                </Space>
              </div>
            ))}
          </div>
        ) : (
          <Text type="secondary">暂无选项</Text>
        )}
      </div>
    );
  };

  const renderEdgeDetails = (edgeData: any) => {
    return (
      <div>
        <Descriptions column={1} bordered>
          <Descriptions.Item label="关系类型">
            <Tag color={edgeData.type === 'relation' ? 'blue' : 'green'}>
              {edgeData.type === 'relation' ? '关联关系' : '枚举关系'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="字段名称">{edgeData.label.split(' (')[0]}</Descriptions.Item>
          <Descriptions.Item label="源节点">{edgeData.source}</Descriptions.Item>
          <Descriptions.Item label="目标节点">{edgeData.target}</Descriptions.Item>
        </Descriptions>
        
        {edgeData.type === 'relation' && (
          <div style={{ marginTop: 16 }}>
            <Text strong>关系详情:</Text>
            <br />
            <Text type="secondary">关系类型: {edgeData.relationType}</Text>
          </div>
        )}
        
        {edgeData.type === 'enum' && (
          <div style={{ marginTop: 16 }}>
            <Text strong>枚举详情:</Text>
            <br />
            <Text type="secondary">选择方式: {edgeData.multiple ? '多选' : '单选'}</Text>
          </div>
        )}
      </div>
    );
  };

  const handleHideEnumsChange = (checked: boolean) => {
    console.log('隐藏枚举状态变化:', checked);
    setHideEnums(checked);
    
    if (cyRef.current) {
      const cy = cyRef.current;
      
      if (checked) {
        // 隐藏枚举节点
        cy.$('node[type = "enum"]').hide();
        // 隐藏连接到枚举的边
        cy.$('edge[type = "enum"]').hide();
      } else {
        // 显示枚举节点
        cy.$('node[type = "enum"]').show();
        // 显示连接到枚举的边
        cy.$('edge[type = "enum"]').show();
      }
      
      // 重新布局，确保能看到动画
      cy.layout(getLayoutConfig(currentLayout)).run();
    }
  };

  const handleResetView = () => {
    console.log('重置画布视图');
    if (cyRef.current) {
      const cy = cyRef.current;
      cy.fit();
      cy.center();
    }
  };

  const handleResetTo1To1 = () => {
    console.log('重置为1:1比例');
    if (cyRef.current) {
      const cy = cyRef.current;
      cy.zoom(1);
      cy.center();
    }
  };

  const handleFitView = () => {
    console.log('适应视图');
    if (cyRef.current) {
      const cy = cyRef.current;
      cy.fit();
    }
  };

  const handleExportImage = () => {
    console.log('导出图片');
    if (cyRef.current) {
      const cy = cyRef.current;
      
      // 获取画布数据URL
      const png = cy.png({
        full: true,
        quality: 1,
        output: 'blob'
      });
      
      // 创建下载链接
      const url = URL.createObjectURL(png);
      const link = document.createElement('a');
      link.href = url;
      link.download = `schema-graph-${new Date().toISOString().slice(0, 10)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const initCytoscape = async () => {
    console.log('开始初始化 Cytoscape');
    
    // 直接通过 ID 获取容器元素
    let container = document.getElementById('cytoscape-container');
    
    if (!container) {
      console.error('容器元素未找到!');
      setError('容器元素未找到');
      return;
    }

    console.log('找到容器元素:', container);
    console.log('容器尺寸:', container.offsetWidth, 'x', container.offsetHeight);

    try {
      // 获取真实数据
      console.log('开始获取真实数据...');
      const [schemasData, enumsData] = await Promise.all([
        getSchemas({ code: undefined, name: undefined }),
        getEnums({})
      ]);

      console.log('获取到的数据表:', schemasData);
      console.log('获取到的枚举:', enumsData);

      // 先设置状态，确保数据可用
      setSchemas(schemasData);
      setEnums(enumsData);

      // 构建 cytoscape 数据
      const nodes: any[] = [];
      const edges: any[] = [];

      // 添加数据表节点
      schemasData.forEach((schema) => {
        if (schema.code && schema.name) {
          const label = schema.description 
            ? `${schema.name}\n${schema.description}`
            : schema.name;
          nodes.push({
            data: {
              id: schema.code,
              label: label,
              type: 'schema',
              name: schema.name,
              description: schema.description
            }
          });
        }
      });

      // 添加枚举节点
      enumsData.forEach((enumItem) => {
        if (enumItem.code) {
          const label = enumItem.description 
            ? `${enumItem.name}\n${enumItem.description}`
            : enumItem.name;
          nodes.push({
            data: {
              id: enumItem.code,
              label: label,
              type: 'enum',
              name: enumItem.name,
              description: enumItem.description
            }
          });
        }
      });

      // 处理关联关系
      schemasData.forEach((schema) => {
        schema.fields?.forEach((field) => {
          // 处理关联字段
          if (field.type === 'relation' && field.relationConfig?.targetSchemaCode && field.name && schema.code) {
            const targetSchema = schemasData.find((s) => s.code === field.relationConfig?.targetSchemaCode);
            if (targetSchema?.code) {
              const relationField = field as API.RelationField;
              const relationType = relationField.relationConfig?.multiple
                ? relationField.relationConfig?.targetSchemaCode === schema.code
                  ? "manyToMany"
                  : "oneToMany"
                : relationField.relationConfig?.targetSchemaCode === schema.code
                ? "manyToOne"
                : "oneToOne";

              edges.push({
                data: {
                  id: `${schema.code}-${targetSchema.code}-${field.name}`,
                  source: schema.code,
                  target: targetSchema.code,
                  label: `${field.name} (${relationType})`,
                  type: 'relation',
                  relationType: relationType
                }
              });
            }
          }
          // 处理枚举字段
          else if (field.type === 'enum' && field.enumConfig?.targetEnumCode && schema.code) {
            const enumField = field as API.EnumField;
            const enumSchema = enumsData.find((e) => e.code === enumField.enumConfig?.targetEnumCode);
            
            if (enumSchema && enumSchema.code) {
              edges.push({
                data: {
                  id: `${schema.code}-${enumSchema.code}-${field.name}`,
                  source: schema.code,
                  target: enumSchema.code,
                  label: `${field.name} (${enumField.enumConfig?.multiple ? '多选' : '单选'})`,
                  type: 'enum',
                  multiple: enumField.enumConfig?.multiple
                }
              });
            }
          }
        });
      });

      const graphData = { nodes, edges };
      console.log('构建的图谱数据:', graphData);

      console.log('开始创建 Cytoscape 实例...');
      const cy = cytoscape({
        container: container,
        elements: graphData,
        style: [
          {
            selector: 'node',
            style: {
              'background-color': 'data(type)',
              'label': 'data(label)',
              'color': '#fff',
              'width': 'data(type)',
              'height': 'data(type)',
              'font-size': '13px',
              'text-valign': 'center',
              'text-halign': 'center',
              'text-wrap': 'wrap',
              'text-max-width': '80px',
              'border-width': 0
            }
          },
          {
            selector: 'node[type = "schema"]',
            style: {
              'background-color': '#1890ff',
              'width': '100px',
              'height': '100px',
              'font-size': '16px',
              'text-max-width': '90px'
            }
          },
          {
            selector: 'node[type = "enum"]',
            style: {
              'background-color': '#52c41a',
              'width': '80px',
              'height': '80px',
              'font-size': '14px',
              'text-max-width': '70px'
            }
          },
          {
            selector: 'edge',
            style: {
              'width': 2,
              'line-color': '#fff',
              'target-arrow-color': '#fff',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'label': 'data(label)',
              'color': '#fff',
              'font-size': '10px',
              'text-rotation': 'autorotate',
              'text-margin-y': -10
            }
          },
          {
            selector: 'edge[type = "relation"]',
            style: {
              'line-color': '#1890ff',
              'target-arrow-color': '#1890ff',
              'width': 3
            }
          },
          {
            selector: 'edge[type = "enum"]',
            style: {
              'line-color': '#52c41a',
              'target-arrow-color': '#52c41a',
              'width': 2,
              'line-style': 'dashed'
            }
          }
        ],
        layout: getLayoutConfig('cola')
      });

      // 保存 cytoscape 实例引用
      cyRef.current = cy;

      console.log('Cytoscape 实例创建成功:', cy);
      console.log('节点数量:', cy.nodes().length);
      console.log('边数量:', cy.edges().length);

      // 添加交互事件
      cy.on('tap', 'node', function(evt) {
        const node = evt.target;
        console.log('点击节点:', node.data());
        // 直接使用获取到的数据，而不是状态
        showNodeDetailsWithData(node.data(), schemasData, enumsData);
      });

      cy.on('tap', 'edge', function(evt) {
        const edge = evt.target;
        console.log('点击边:', edge.data());
        showEdgeDetails(edge.data());
      });

      // 自动适应容器大小
      cy.fit();
      console.log('执行了 cy.fit()');
      
      // 强制重新渲染
      cy.resize();
      console.log('执行了 cy.resize()');
      
    } catch (error) {
      console.error('Cytoscape 初始化失败:', error);
      setError('Cytoscape 初始化失败: ' + error);
    }
  };

  return (
    <>
      <div style={{ width: "100%", height: "calc(100vh - 55px)", background: "#000" }}>
        {loading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            background: '#000',
            color: '#fff',
            fontSize: '20px'
          }}>
            加载中...
          </div>
        ) : (
          <div 
            id="cytoscape-container"
            style={{ 
              width: '100%', 
              height: '100%',
              background: '#000'
            }}
          />
        )}
      </div>
      
      <Button 
        type="primary"
        ghost
        className="position-absolute"
        style={{ top: "10px", left: "10px", zIndex: 1000 }}
        icon={<RollbackOutlined />}
        onClick={() => {
          history.back();
        }}
      >
        返回
      </Button>

      {/* 控制面板 */}
      <Card
        size="small"
        className="position-absolute"
        style={{ 
          top: "10px", 
          right: "10px", 
          zIndex: 1000,
          background: '#fafafa0a',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        <Space size="small">
          <Checkbox 
            checked={hideEnums}
            onChange={(e: any) => handleHideEnumsChange(e.target.checked)}
          >
            隐藏枚举
          </Checkbox>
          
          <Button 
            size="small"
            icon={<OneToOneOutlined />}
            onClick={handleResetTo1To1}
          >
            1:1
          </Button>
          
          <Button 
            size="small"
            icon={<GatewayOutlined />}
            onClick={handleFitView}
          />
          
          {/* <Select
            size="small"
            style={{ width: 120 }}
            value={currentLayout}
            onChange={handleLayoutChange}
            options={layoutOptions}
            placeholder="选择布局"
          /> */}
          
          <Button 
            size="small"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExportImage}
          >
            导出
          </Button>
        </Space>
      </Card>

      <Drawer
        title={drawerTitle}
        placement="right"
        width={600}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        {drawerContent && (
          <>
            {drawerContent.type === 'schema' && renderSchemaDetails(drawerContent.data)}
            {drawerContent.type === 'enum' && renderEnumDetails(drawerContent.data)}
            {drawerContent.type === 'edge' && renderEdgeDetails(drawerContent.data)}
          </>
        )}
      </Drawer>
    </>
  );
};

export default SchemaGraphNew2; 