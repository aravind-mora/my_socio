import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Star } from "lucide-react";
import { categoryArt, gradFor, fmtMoney, initialsOf } from "../utils/helpers";
import StarRating from "./StarRating";

export default function ServiceCard({ service, index = 0 }) {
  const art = categoryArt(service.category);
  const provider = service.provider || {};
  const thumbBg = service.image || service.images?.[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.06, 0.6), type: "spring", stiffness: 200, damping: 20 }}
    >
      <Link to={`/service/${service._id || service.id}`} style={{ textDecoration: "none", color: "inherit" }}>
        <div className="glass service-card card-hover" style={{ height: "100%" }}>
          <div className="service-thumb">
            <div className="emoji-bg" style={{ background: gradFor(service.category || "") }} />
            {thumbBg ? (
              <img src={thumbBg} alt={service.title} loading="lazy" />
            ) : (
              <span style={{ filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.35))" }}>{art.emoji}</span>
            )}
            <span className="tag" style={{ position: "absolute", top: 12, left: 12, background: "rgba(13,7,22,0.75)", color: "#ffd166" }}>
              {art.label}
            </span>
            <span className="tag" style={{ position: "absolute", top: 12, right: 12, background: "rgba(13,7,22,0.75)", color: "var(--text)" }}>
              {fmtMoney(service.price)}
            </span>
          </div>

          <div className="service-body">
            <h3 className="service-title">{service.title}</h3>
            <div className="row" style={{ gap: 5 }}>
              <StarRating value={service.provider?.averageRating || 0} size="0.95rem" />
              <span className="tiny">
                ({service.provider?.totalReviews || 0})
              </span>
            </div>
            <p className="tiny" style={{ lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: 36 }}>
              {service.description}
            </p>
            <div className="provider-row">
              <span className="avatar" style={{ width: 34, height: 34, fontSize: "0.85rem" }}>
                {initialsOf(provider.fullName || provider.name)}
              </span>
              <div className="grow">
                <div style={{ fontSize: "0.88rem", fontWeight: 600 }}>{provider.fullName || provider.name || "Provider"}</div>
                <div className="row" style={{ gap: 4, fontSize: "0.75rem", color: "var(--text-faint)" }}>
                  <MapPin size={11} /> {service.location?.coordinates ? `${service.location.coordinates[1]?.toFixed(2)}, ${service.location.coordinates[0]?.toFixed(2)}` : "Location set"}
                </div>
              </div>
              <span style={{ fontSize: "0.95rem", color: "#ffd166" }}><Star size={13} style={{ verticalAlign: "-2px" }} /> {Number(service.provider?.averageRating || 0).toFixed(1) || "—"}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
