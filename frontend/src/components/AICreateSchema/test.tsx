import React, { useState } from 'react';
import { Button, Space } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import AICreateSchema from './index';

const AICreateSchemaTest: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleSuccess = (schemaData: any) => {
    console.log('AI 创建的数据表:', schemaData);
    alert('数据表创建成功！请查看控制台输出。');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>AI 新建表功能测试</h2>
      <Space>
        <Button
          type="primary"
          icon={<RobotOutlined />}
          onClick={() => setIsModalVisible(true)}
          style={{
            background: 'radial-gradient(117.61% 84.5% at 147.46% 76.45%, rgba(82, 99, 255, 0.8) 0%, rgba(143, 65, 238, 0) 100%), linear-gradient(72deg, rgb(60, 115, 255) 18.03%, rgb(110, 65, 238) 75.58%, rgb(214, 65, 238) 104.34%)',
            border: 'none',
            color: 'white'
          }}
        >
          测试 AI 新建表
        </Button>
      </Space>

      <AICreateSchema
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default AICreateSchemaTest; 