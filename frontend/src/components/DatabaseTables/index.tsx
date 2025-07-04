import React, { useState, useEffect } from 'react';
import { Table, Card, Tag, Divider, message } from 'antd';
import { SyncOutlined, DatabaseOutlined } from '@ant-design/icons';
import { getDatabaseConnectionsIdTables } from '@/services/BDC/api/databaseConnections';

interface DatabaseTablesProps {
  connectionId?: string;
  lastTestSuccess?: boolean;
}

const DatabaseTables: React.FC<DatabaseTablesProps> = ({ 
  connectionId, 
  lastTestSuccess 
}) => {
  const [databaseTables, setDatabaseTables] = useState<any[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);

  // 获取数据库表结构
  const fetchDatabaseTables = async (connectionId: string) => {
    if (!connectionId) return;
    
    setTablesLoading(true);
    try {
      const response = await getDatabaseConnectionsIdTables({ id: connectionId });
      if (response.success && response.data) {
        setDatabaseTables(response.data);
      }
    } catch (error) {
      message.error('获取数据库表结构失败');
    }
    setTablesLoading(false);
  };

  // 监听连接ID变化，获取表结构
  useEffect(() => {
    if (connectionId && lastTestSuccess) {
      fetchDatabaseTables(connectionId);
    } else {
      setDatabaseTables([]);
    }
  }, [connectionId, lastTestSuccess]);

  // 如果没有连接或连接未测试成功
  if (!lastTestSuccess) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
        <DatabaseOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
        <div>请先完成测试连接</div>
      </div>
    );
  }

  // 加载中状态
  if (tablesLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <SyncOutlined spin style={{ fontSize: '24px' }} />
        <div style={{ marginTop: '8px' }}>正在获取表结构...</div>
      </div>
    );
  }

  // 没有表结构数据
  if (databaseTables.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
        暂无表结构信息
      </div>
    );
  }

  return (
    <div>
      {databaseTables.map((table, index) => (
        <Card 
          key={index} 
          title={
            <div>
              <div style={{ fontWeight: 'bold' }}>
                {table.schema}.{table.tableName}
              </div>
              {table.description && (
                <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
                  {table.description}
                </div>
              )}
            </div>
          }
          style={{ marginBottom: '16px' }}
          size="small"
          extra={
            <div style={{ fontSize: '12px', color: '#999' }}>
              {table.rowCount !== undefined && (
                <span style={{ marginRight: '12px' }}>
                  行数: {table.rowCount.toLocaleString()}
                </span>
              )}
              {table.size !== undefined && (
                <span style={{ marginRight: '12px' }}>
                  大小: {(table.size / 1024).toFixed(2)} KB
                </span>
              )}
              {table.updatedAt && (
                <span>
                  更新: {new Date(table.updatedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          }
        >
          <Table
            columns={[
              {
                title: '字段名',
                dataIndex: 'name',
                key: 'name',
                width: '25%',
                render: (name: string, record: API.DatabaseColumn) => (
                  <div>
                    <div style={{ fontWeight: 'bold' }}>
                      {name}
                      {record.primaryKey && (
                        <Tag color="red" style={{ marginLeft: '4px', fontSize: '10px' }}>PK</Tag>
                      )}
                    </div>
                  </div>
                ),
              },
              {
                title: '数据类型',
                dataIndex: 'type',
                key: 'type',
                width: '25%',
                render: (type: string, record: API.DatabaseColumn) => (
                  <div>
                    <div>{type}</div>
                    {record.length && (
                      <div style={{ color: '#666', fontSize: '11px' }}>
                        长度: {record.length}
                      </div>
                    )}
                    {record.precision && record.scale && (
                      <div style={{ color: '#666', fontSize: '11px' }}>
                        精度: {record.precision},{record.scale}
                      </div>
                    )}
                  </div>
                ),
              },
              {
                title: '约束',
                key: 'constraints',
                width: '25%',
                render: (_, record: API.DatabaseColumn) => (
                  <div>
                    {record.primaryKey && (
                      <Tag color="red">主键</Tag>
                    )}
                    {!record.nullable && (
                      <Tag color="green">非空</Tag>
                    )}
                    {record.autoIncrement && (
                      <Tag color="blue">自增</Tag>
                    )}
                    {record.defaultValue && (
                      <div style={{ color: '#666', fontSize: '11px', marginTop: '2px' }}>
                        默认: {record.defaultValue}
                      </div>
                    )}
                  </div>
                ),
              },
              {
                title: '描述',
                dataIndex: 'description',
                key: 'description',
                width: '25%',
                render: (description: string) => (
                  <>
                    {description || '-'}
                  </>
                ),
              },
            ]}
            dataSource={table.columns}
            rowKey="name"
            pagination={false}
            size="small"
          />
          
          {/* 显示索引信息 */}
          {table.indexes && table.indexes.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <Divider orientation="left" style={{ fontSize: '12px' }}>索引</Divider>
              <Table
                columns={[
                  {
                    title: '索引名',
                    dataIndex: 'name',
                    key: 'name',
                    width: '30%',
                  },
                  {
                    title: '类型',
                    dataIndex: 'type',
                    key: 'type',
                    width: '20%',
                    render: (type: string) => (
                      <Tag color={
                        type === 'PRIMARY' ? 'red' : 
                        type === 'UNIQUE' ? 'orange' : 'blue'
                      }>
                        {type}
                      </Tag>
                    ),
                  },
                  {
                    title: '字段',
                    dataIndex: 'columns',
                    key: 'columns',
                    width: '50%',
                    render: (columns: string[]) => columns.join(', '),
                  },
                ]}
                dataSource={table.indexes}
                rowKey="name"
                pagination={false}
                size="small"
              />
            </div>
          )}
          
          {/* 显示外键信息 */}
          {table.foreignKeys && table.foreignKeys.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <Divider orientation="left" style={{ fontSize: '12px' }}>外键</Divider>
              <Table
                columns={[
                  {
                    title: '外键名',
                    dataIndex: 'name',
                    key: 'name',
                    width: '25%',
                  },
                  {
                    title: '字段',
                    dataIndex: 'columnName',
                    key: 'columnName',
                    width: '20%',
                  },
                  {
                    title: '引用表',
                    dataIndex: 'referencedTableName',
                    key: 'referencedTableName',
                    width: '25%',
                    render: (tableName: string, record: API.DatabaseForeignKey) => (
                      `${record.referencedTableSchema || ''}.${tableName}`
                    ),
                  },
                  {
                    title: '引用字段',
                    dataIndex: 'referencedColumnName',
                    key: 'referencedColumnName',
                    width: '20%',
                  },
                  {
                    title: '规则',
                    key: 'rules',
                    width: '10%',
                    render: (_, record: API.DatabaseForeignKey) => (
                      <div style={{ fontSize: '11px' }}>
                        <div>更新: {record.updateRule || '-'}</div>
                        <div>删除: {record.deleteRule || '-'}</div>
                      </div>
                    ),
                  },
                ]}
                dataSource={table.foreignKeys}
                rowKey="name"
                pagination={false}
                size="small"
              />
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

export default DatabaseTables; 