import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { TokenProfile } from "@/components/business/TokenProfile";
import { useGoodId } from "@/stores/valueGood";

export default function TokenDetailPage() {
  const { tokens_id } = useParams<{ tokens_id: string }>();
  const navigate = useNavigate();
  const { setGoodId } = useGoodId();

  useEffect(() => {
    setGoodId({
      swap: { id: tokens_id },
      invest: { id: tokens_id },
    });
  }, [tokens_id, setGoodId]);

  return (
    <div className="app-page token-detail-page">
      <TokenProfile handleBack={() => navigate("/tokens")} tokenId={tokens_id} />
    </div>
  );
}
