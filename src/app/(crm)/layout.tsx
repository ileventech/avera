import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import AccessGuard from '@/components/AccessGuard';
import styles from './crm.module.css';
import { ToastProvider } from '@/components/Toast';
import { SidebarProvider } from '@/components/SidebarContext';

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <SidebarProvider>
        <div className={styles.crmContainer}>
          <Sidebar />
          <div className={styles.mainWrapper}>
            <TopHeader />
            <div className={styles.contentArea}>
              <AccessGuard>
                {children}
              </AccessGuard>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </ToastProvider>
  );
}
