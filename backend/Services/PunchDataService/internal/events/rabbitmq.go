package events

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"sync"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/google/uuid"
)

// RabbitMQConfig configures the integration event publisher.
type RabbitMQConfig struct {
	HostName     string
	UserName     string
	Password     string
	ExchangeName string
}

// RabbitPublisher publishes PunchLogCollected to a topic exchange.
type RabbitPublisher struct {
	cfg    RabbitMQConfig
	logger *slog.Logger
	mu     sync.Mutex
	conn   *amqp.Connection
}

func NewRabbitPublisher(cfg RabbitMQConfig, logger *slog.Logger) *RabbitPublisher {
	if cfg.ExchangeName == "" {
		cfg.ExchangeName = "erp.events"
	}
	return &RabbitPublisher{cfg: cfg, logger: logger}
}

func (p *RabbitPublisher) PublishPunchLogCollected(ctx context.Context, payload PunchLogCollectedPayload) error {
	if payload.EventID == uuid.Nil {
		payload.EventID = uuid.New()
	}
	if payload.OccurredOn.IsZero() {
		payload.OccurredOn = time.Now().UTC()
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	ch, err := p.channel()
	if err != nil {
		return err
	}
	defer ch.Close()

	return ch.PublishWithContext(ctx, p.cfg.ExchangeName, PunchLogCollected, false, false, amqp.Publishing{
		ContentType:  "application/json",
		DeliveryMode: amqp.Persistent,
		Body:         body,
	})
}

func (p *RabbitPublisher) channel() (*amqp.Channel, error) {
	p.mu.Lock()
	defer p.mu.Unlock()

	if p.conn == nil || p.conn.IsClosed() {
		conn, err := amqp.Dial(p.dialURL())
		if err != nil {
			return nil, fmt.Errorf("rabbitmq dial: %w", err)
		}
		p.conn = conn
	}
	ch, err := p.conn.Channel()
	if err != nil {
		return nil, fmt.Errorf("rabbitmq channel: %w", err)
	}
	if err := ch.ExchangeDeclare(p.cfg.ExchangeName, amqp.ExchangeTopic, true, false, false, false, nil); err != nil {
		_ = ch.Close()
		return nil, fmt.Errorf("rabbitmq exchange: %w", err)
	}
	return ch, nil
}

func (p *RabbitPublisher) dialURL() string {
	return fmt.Sprintf("amqp://%s:%s@%s/",
		p.cfg.UserName,
		p.cfg.Password,
		p.cfg.HostName,
	)
}

func (p *RabbitPublisher) Close() error {
	p.mu.Lock()
	defer p.mu.Unlock()
	if p.conn != nil {
		return p.conn.Close()
	}
	return nil
}
