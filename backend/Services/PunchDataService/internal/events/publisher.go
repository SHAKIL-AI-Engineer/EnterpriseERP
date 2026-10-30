package events

import "context"

// Publisher emits integration events when raw punch logs are collected.
type Publisher interface {
	PublishPunchLogCollected(ctx context.Context, payload PunchLogCollectedPayload) error
}

// NoopPublisher logs events when RabbitMQ is not configured.
type NoopPublisher struct{}

func (NoopPublisher) PublishPunchLogCollected(context.Context, PunchLogCollectedPayload) error {
	return nil
}
