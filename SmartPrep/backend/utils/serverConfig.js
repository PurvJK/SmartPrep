export const shouldUseClusterMode = (env = process.env, platform = process.platform) => {
  const enableCluster = env.CLUSTER_MODE === 'true';
  const isWindows = platform === 'win32';
  const forceSingleProcess = env.NODE_ENV === 'test' || env.SINGLE_PROCESS === 'true';

  return enableCluster && !isWindows && !forceSingleProcess;
};
