import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PropsWithChildren } from "react";
import {  Modal } from 'antd';

type Props = PropsWithChildren<{
  open: boolean;
  setOpen: (value: boolean) => void;
  title: string;
}>;
const CreatModal = ({ open, setOpen, title, children }: Props) => {
  const {t} = useTranslation();
  const handleClose = (a: boolean, b: string) => {
    setOpen(a);
    document.body.style.overflow = b;
  };
  return (
    <Modal
    closeIcon={<X size={18} aria-label={t("tradeUx.close")}/>}
    className="app-modal"
    centered
    title={title}
    open={open}
    onCancel={() => handleClose(false, "")}
    footer={null}
    width={520}
    destroyOnHidden={true}
    >
        {children}
    </Modal>
  );
};

export default CreatModal;
