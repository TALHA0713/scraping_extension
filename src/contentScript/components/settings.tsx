import React, { useState, useEffect } from 'react';

type SettingsProps = {
  onBack: () => void;
};

interface SystemInfo {
  ipAddress: string;
  userAgent: string;
  platform: string;
  language: string;
  languages: string[];
  screenResolution: string;
  viewport: string;
  timezone: string;
  timezoneOffset: number;
  colorDepth: number;
  pixelRatio: number;
  cookiesEnabled: boolean;
  doNotTrack: string | null;
  onlineStatus: boolean;
  connection: string;
  hardwareConcurrency: number;
  deviceMemory: string;
  maxTouchPoints: number;
  vendor: string;
  timestamp: string;
  browserName: string;
  browserVersion: string;
  osName: string;
  osVersion: string;
  macAddress: string;
}

const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemInfo();
  }, []);

  const getBrowserInfo = (userAgent: string) => {
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';

    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      browserName = 'Chrome';
      const match = userAgent.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('Edg')) {
      browserName = 'Microsoft Edge';
      const match = userAgent.match(/Edg\/(\d+\.\d+\.\d+\.\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('Firefox')) {
      browserName = 'Firefox';
      const match = userAgent.match(/Firefox\/(\d+\.\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browserName = 'Safari';
      const match = userAgent.match(/Version\/(\d+\.\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    }

    return { browserName, browserVersion };
  };

  const getOSInfo = (userAgent: string, platform: string) => {
    let osName = 'Unknown';
    let osVersion = 'Unknown';

    if (userAgent.includes('Windows NT 10.0')) {
      osName = 'Windows';
      osVersion = '10/11';
    } else if (userAgent.includes('Windows NT 6.3')) {
      osName = 'Windows';
      osVersion = '8.1';
    } else if (userAgent.includes('Windows NT 6.2')) {
      osName = 'Windows';
      osVersion = '8';
    } else if (userAgent.includes('Windows NT 6.1')) {
      osName = 'Windows';
      osVersion = '7';
    } else if (userAgent.includes('Mac OS X')) {
      osName = 'macOS';
      const match = userAgent.match(/Mac OS X (\d+[._]\d+[._]\d+)/);
      if (match) {
        osVersion = match[1].replace(/_/g, '.');
      }
    } else if (userAgent.includes('Linux')) {
      osName = 'Linux';
      osVersion = platform;
    } else if (userAgent.includes('Android')) {
      osName = 'Android';
      const match = userAgent.match(/Android (\d+\.\d+)/);
      osVersion = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      osName = 'iOS';
      const match = userAgent.match(/OS (\d+_\d+)/);
      if (match) {
        osVersion = match[1].replace(/_/g, '.');
      }
    }

    return { osName, osVersion };
  };

  const fetchSystemInfo = async () => {
    try {
      const userAgent = navigator.userAgent;
      const platform = navigator.platform;
      const { browserName, browserVersion } = getBrowserInfo(userAgent);
      const { osName, osVersion } = getOSInfo(userAgent, platform);

      const info: any = {
        userAgent,
        platform,
        browserName,
        browserVersion,
        osName,
        osVersion,
        language: navigator.language,
        languages: navigator.languages ? Array.from(navigator.languages) : [navigator.language],
        screenResolution: `${screen.width} × ${screen.height}`,
        viewport: `${window.innerWidth} × ${window.innerHeight}`,
        colorDepth: screen.colorDepth,
        pixelRatio: window.devicePixelRatio,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: new Date().getTimezoneOffset(),
        cookiesEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack,
        onlineStatus: navigator.onLine,
        hardwareConcurrency: navigator.hardwareConcurrency || 0,
        deviceMemory: (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB` : 'N/A',
        maxTouchPoints: navigator.maxTouchPoints || 0,
        vendor: navigator.vendor,
        timestamp: new Date().toISOString(),
        macAddress: 'Not accessible from browser'
      };

      // Get connection type if available
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      info.connection = connection ? connection.effectiveType || 'Unknown' : 'N/A';

      // Try to get IP address
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        info.ipAddress = ipData.ip;
      } catch (error) {
        info.ipAddress = 'Unable to fetch';
      }

      setSystemInfo(info);
    } catch (error) {
      console.error('Error fetching system info:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const InfoRow = ({ label, value, canCopy = true }: { label: string; value: string | number | boolean; canCopy?: boolean }) => (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 0',
      borderBottom: '1px solid #e5e7eb'
    }}>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '12px',
          color: '#6b7280',
          marginBottom: '4px',
          fontWeight: '500'
        }}>
          {label}
        </div>
        <div style={{
          fontSize: '14px',
          color: '#1f2937',
          wordBreak: 'break-all'
        }}>
          {String(value)}
        </div>
      </div>
      {canCopy && (
        <button
          onClick={() => copyToClipboard(String(value))}
          style={{
            marginLeft: '12px',
            padding: '6px 12px',
            background: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#6b7280',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e5e7eb';
            e.currentTarget.style.borderColor = '#9ca3af';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f3f4f6';
            e.currentTarget.style.borderColor = '#d1d5db';
          }}
        >
          Copy
        </button>
      )}
    </div>
  );

  return (
    <div style={{
      padding: '24px',
      width: '100%',
      maxWidth: '400px',
      height: '500px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '2px solid #e5e7eb',
        paddingBottom: '16px'
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: '#6b7280',
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          ←
        </button>
        <div>
          <h2 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: '600',
            color: '#1f2937'
          }}>
            System Information
          </h2>
          <p style={{
            margin: '4px 0 0 0',
            fontSize: '13px',
            color: '#6b7280'
          }}>
            Your device and network details
          </p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid #e5e7eb',
            borderTop: '3px solid #FFB514',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      ) : systemInfo ? (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingRight: '8px',
          scrollbarWidth: 'thin',
          scrollbarColor: '#FFB514 #f3f4f6'
        }}
        className="settings-scroll"
        >
          {/* Network Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '14px',
              fontWeight: '600',
              color: '#FFB514',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              🌐 Network Information
            </h3>
            <InfoRow label="IP Address" value={systemInfo.ipAddress} />
            <InfoRow label="Online Status" value={systemInfo.onlineStatus ? 'Online' : 'Offline'} canCopy={false} />
            <InfoRow label="Connection Type" value={systemInfo.connection} />
            <InfoRow label="Do Not Track" value={systemInfo.doNotTrack || 'Not set'} canCopy={false} />
          </div>

          {/* Browser Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '14px',
              fontWeight: '600',
              color: '#FFB514',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              🌐 Browser Information
            </h3>
            <InfoRow label="Browser Name" value={systemInfo.browserName} />
            <InfoRow label="Browser Version" value={systemInfo.browserVersion} />
            <InfoRow label="Vendor" value={systemInfo.vendor} />
          </div>

          {/* System Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '14px',
              fontWeight: '600',
              color: '#FFB514',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              💻 Operating System
            </h3>
            <InfoRow label="OS Name" value={systemInfo.osName} />
            <InfoRow label="OS Version" value={systemInfo.osVersion} />
            <InfoRow label="Platform" value={systemInfo.platform} />
          </div>

          {/* Hardware Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '14px',
              fontWeight: '600',
              color: '#FFB514',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              🔧 Hardware Information
            </h3>
            <InfoRow label="User Agent" value={systemInfo.userAgent} />
            <InfoRow label="CPU Cores" value={systemInfo.hardwareConcurrency} canCopy={false} />
            <InfoRow label="Device Memory" value={systemInfo.deviceMemory} canCopy={false} />
            <InfoRow label="MAC Address" value={systemInfo.macAddress} canCopy={false} />
          </div>

          {/* Display Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '14px',
              fontWeight: '600',
              color: '#FFB514',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              🖥️ Display Information
            </h3>
            <InfoRow label="Screen Resolution" value={systemInfo.screenResolution} />
            <InfoRow label="Viewport Size" value={systemInfo.viewport} />
            <InfoRow label="Color Depth" value={`${systemInfo.colorDepth}-bit`} canCopy={false} />
            <InfoRow label="Pixel Ratio" value={systemInfo.pixelRatio} canCopy={false} />
            <InfoRow label="Max Touch Points" value={systemInfo.maxTouchPoints} canCopy={false} />
          </div>

          {/* Location Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '14px',
              fontWeight: '600',
              color: '#FFB514',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              🌍 Location & Language
            </h3>
            <InfoRow label="Timezone" value={systemInfo.timezone} />
            <InfoRow label="UTC Offset" value={`${systemInfo.timezoneOffset} minutes`} canCopy={false} />
            <InfoRow label="Primary Language" value={systemInfo.language} />
            <InfoRow label="Languages" value={systemInfo.languages.join(', ')} />
          </div>

          {/* Privacy Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '14px',
              fontWeight: '600',
              color: '#FFB514',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              🔐 Privacy & Settings
            </h3>
            <InfoRow label="Cookies Enabled" value={systemInfo.cookiesEnabled ? 'Yes' : 'No'} canCopy={false} />
            <InfoRow label="Last Updated" value={new Date(systemInfo.timestamp).toLocaleString()} />
          </div>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1,
          color: '#ef4444',
          fontSize: '14px'
        }}>
          Failed to load system information
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .settings-scroll::-webkit-scrollbar {
            width: 8px;
          }

          .settings-scroll::-webkit-scrollbar-track {
            background: #f3f4f6;
            border-radius: 4px;
          }

          .settings-scroll::-webkit-scrollbar-thumb {
            background: #FFB514;
            border-radius: 4px;
          }

          .settings-scroll::-webkit-scrollbar-thumb:hover {
            background: #e5a312;
          }
        `}
      </style>
    </div>
  );
};

export default Settings;
