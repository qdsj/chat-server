import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as OSS from 'ali-oss';

@Injectable()
export class OssService {
  constructor(private configService: ConfigService) {}

  async getTempSignature() {
    const config = {
      // 配置环境变量ALIBABA_CLOUD_ACCESS_KEY_ID。
      accessKeyId: this.configService.get('OSS_ACCESS_KEY'),
      // 配置环境变量ALIBABA_CLOUD_ACCESS_KEY_SECRET。
      accessKeySecret: this.configService.get('OSS_ACCESS_KEY_SECRET'),
      // 将<YOUR-BUCKET>替换为Bucket名称。
      bucket: this.configService.get('BUCKET_NAME'),
    };

    const client = new OSS(config);
    const date = new Date();
    // 设置签名的有效期，单位为秒。
    date.setSeconds(date.getSeconds() + 60);
    const policy = {
      expiration: date.toISOString(),
      conditions: [
        // 设置上传文件的大小限制。
        ['content-length-range', 0, 1048576000],
        // 限制可上传的Bucket。
        { bucket: client.options.bucket },
      ],
    };
    const formData = await client.calculatePostSignature(policy);
    const host = `http://${config.bucket}.${
      (await client.getBucketLocation()).location
    }.aliyuncs.com`.toString();

    const params = {
      policy: formData.policy,
      signature: formData.Signature,
      ossAccessKeyId: formData.OSSAccessKeyId,
      host,
    };

    return params;
  }
}
